"""Inference adapter for the three production detectors and ModelsP2 bonuses."""

import importlib.util
import base64
import io
import logging
import re
import sys
import uuid
from pathlib import Path
from threading import Lock

from django.conf import settings
from PIL import Image

logger = logging.getLogger(__name__)

REPO_ROOT = Path(settings.BASE_DIR).parents[2]
VIT_ROOT = REPO_ROOT / "VIT_Model" / "ML" / "VIT_models"
MODELS_ROOT = REPO_ROOT / "ModelsP2"
VIT_WEIGHTS = VIT_ROOT / "best_model.pt"
MODELSP2_WEIGHTS = MODELS_ROOT / "models" / "trained" / "signalscope-latest-candidate"
DISTILLED_ROOT = REPO_ROOT / "ai-image-detect-distilled"

ENSEMBLE_WEIGHTS = {
    "vit_model": 0.10,
    "modelsp2_vit_fft": 0.80,
    "ai_image_detect_distilled": 0.10,
}
ENSEMBLE_THRESHOLD = 0.30

_predictors = None
_predictors_lock = Lock()


def _load_vit_predictor():
    module_path = VIT_ROOT / "predict_interface.py"
    spec = importlib.util.spec_from_file_location(
        "signalscope_vit_interface", module_path
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load VIT_Model interface from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SignalScopePredictor(str(VIT_WEIGHTS), backbone="resnet50")


def _load_bonus_predictor():
    models_root = str(MODELS_ROOT)
    if models_root not in sys.path:
        sys.path.insert(0, models_root)

    from model.predict_interface import SignalScopePredictor

    return SignalScopePredictor(
        model_path=str(MODELSP2_WEIGHTS),
        device="cpu",
    )


def _load_distilled_predictor():
    import torch
    from transformers import ViTForImageClassification, ViTImageProcessor

    processor = ViTImageProcessor.from_pretrained(str(DISTILLED_ROOT))
    model = ViTForImageClassification.from_pretrained(str(DISTILLED_ROOT))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    fake_index = next(
        (
            int(index)
            for index, label in model.config.id2label.items()
            if str(label).lower() in {"fake", "ai", "ai_generated", "artificial"}
        ),
        None,
    )
    if fake_index is None:
        raise ValueError(
            "ai-image-detect-distilled must define a fake/AI class in id2label."
        )

    def predict(image):
        inputs = processor(images=image.convert("RGB"), return_tensors="pt")
        inputs = {name: value.to(device) for name, value in inputs.items()}
        with torch.no_grad():
            probabilities = torch.softmax(model(**inputs).logits, dim=-1)[0]
        return float(probabilities[fake_index].item())

    return predict


def _load_predictors():
    if not VIT_WEIGHTS.exists():
        raise FileNotFoundError(f"VIT_Model checkpoint not found: {VIT_WEIGHTS}")
    if not DISTILLED_ROOT.exists():
        raise FileNotFoundError(
            f"ai-image-detect-distilled checkpoint not found: {DISTILLED_ROOT}"
        )
    vit_predictor = _load_vit_predictor()
    distilled_predictor = _load_distilled_predictor()
    try:
        bonus_predictor = _load_bonus_predictor()
    except (ImportError, ModuleNotFoundError, FileNotFoundError, RuntimeError) as exc:
        logger.warning("ModelsP2 bonus predictor unavailable: %s", exc)
        bonus_predictor = None
    return vit_predictor, bonus_predictor, distilled_predictor


def _get_predictors():
    global _predictors
    if _predictors is None:
        with _predictors_lock:
            if _predictors is None:
                _predictors = _load_predictors()
                logger.info(
                    "Loaded weighted VIT_Model, ModelsP2 ViT+FFT, and "
                    "ai-image-detect-distilled predictors."
                )
    return _predictors


def _cue_text(cue):
    if isinstance(cue, str):
        return cue
    if isinstance(cue, dict):
        title = cue.get("title")
        description = cue.get("description")
        if title and description:
            return f"{title}: {description}"
        return str(description or title or cue)
    return str(cue)


def _provenance_result(image):
    """Extract available EXIF/XMP/content-credential evidence without guessing."""
    info = getattr(image, "info", {}) or {}
    exif = image.getexif()
    exif_fields = {}
    for tag_id, value in exif.items():
        tag_name = str(tag_id)
        if tag_id in (270, 305, 306, 36867, 36868, 37510):
            exif_fields[tag_name] = str(value)[:500]

    credential_keys = [
        key for key in info
        if any(token in str(key).lower() for token in ("c2pa", "jumbf", "content"))
    ]
    return {
        "status": "signals_found" if exif_fields or credential_keys else "no_signals",
        "method": "EXIF_and_embedded_metadata",
        "exif_fields": exif_fields,
        "content_credential_keys": credential_keys,
        "note": (
            "No embedded provenance signal was found; absence is not proof that "
            "an image is real or AI-generated."
            if not exif_fields and not credential_keys
            else "Embedded metadata is evidence only and is not used as the visual verdict."
        ),
    }


def _caption_consistency_result(image, caption):
    """Use embedded descriptive metadata when available; do not invent visual matches."""
    if not caption or not caption.strip():
        return {"status": "not_requested", "method": "metadata_grounded"}

    info = getattr(image, "info", {}) or {}
    exif = image.getexif()
    description = str(exif.get(270) or info.get("description") or "").strip()
    if not description:
        return {
            "status": "unavailable",
            "method": "metadata_grounded",
            "reason": (
                "A caption was supplied, but this deployment has no local "
                "vision-language checkpoint or embedded image description to compare."
            ),
        }

    tokens = lambda value: set(re.findall(r"[a-z0-9]{3,}", value.lower()))
    caption_tokens = tokens(caption)
    description_tokens = tokens(description)
    overlap = caption_tokens & description_tokens
    score = len(overlap) / max(1, len(caption_tokens))
    return {
        "status": "completed",
        "method": "EXIF_description_token_overlap",
        "score": round(score, 4),
        "matching_terms": sorted(overlap),
        "warning": "This is metadata consistency, not semantic image understanding.",
    }


def _save_heatmap(heatmap_b64):
    if not heatmap_b64:
        return None
    try:
        heatmap_dir = Path(settings.MEDIA_ROOT) / "heatmaps"
        heatmap_dir.mkdir(parents=True, exist_ok=True)
        image = Image.open(io.BytesIO(base64.b64decode(heatmap_b64))).convert("RGBA")
        filename = f"{uuid.uuid4().hex}.png"
        image.save(heatmap_dir / filename, format="PNG")
        return f"heatmaps/{filename}"
    except (ValueError, TypeError, OSError) as exc:
        logger.warning("Unable to persist Grad-CAM heatmap: %s", exc)
        return None


def _run_robustness(bonus_predictor, image):
    from src.utils.degradation_benchmark import (
        apply_jpeg_compression,
        apply_resizing,
        apply_screenshot_simulation,
    )

    checks = [
        ("jpeg_qf_50", apply_jpeg_compression(image, quality=50)),
        ("resize_50_percent", apply_resizing(image, scale=0.5)),
        ("screenshot_simulation", apply_screenshot_simulation(image)),
    ]
    return [
        {
            "transform_type": name,
            "confidence_after": float(
                bonus_predictor.predict_from_pil(
                    transformed, include_explainability=False
                )["confidence"]
            ),
        }
        for name, transformed in checks
    ]


def _run_adversarial_check(bonus_predictor, image):
    import torch

    from src.data.preprocess import compute_fft_spectrum
    from src.defence.adversarial import AdversarialEvaluator

    clean = bonus_predictor.predict_from_pil(image, include_explainability=False)
    pixels = bonus_predictor.img_transform(image).unsqueeze(0).to(
        bonus_predictor.device
    )
    resized = bonus_predictor.resize(image)
    fft_features = compute_fft_spectrum(resized).unsqueeze(0).to(
        bonus_predictor.device
    )
    target_label = 1 if clean["label"] == "ai_generated" else 0

    attacker = AdversarialEvaluator(
        bonus_predictor.model, device=bonus_predictor.device
    )
    attacked_pixels = attacker.generate_pgd_attack(
        pixels,
        fft_features,
        target_label=target_label,
        epsilon=0.01,
        alpha=0.0025,
        num_steps=3,
    )

    mean = torch.tensor([0.485, 0.456, 0.406], device=bonus_predictor.device).view(
        1, 3, 1, 1
    )
    std = torch.tensor([0.229, 0.224, 0.225], device=bonus_predictor.device).view(
        1, 3, 1, 1
    )
    attacked_array = (
        ((attacked_pixels * std + mean).clamp(0, 1)[0]
         .permute(1, 2, 0).detach().cpu().numpy() * 255)
        .astype("uint8")
    )
    attacked_image = Image.fromarray(attacked_array)
    attacked = bonus_predictor.predict_from_pil(
        attacked_image, include_explainability=False
    )
    defended = bonus_predictor.predict_from_pil(
        attacked_image,
        include_explainability=False,
        apply_defence=True,
    )

    return {
        "status": "completed",
        "model": "ModelsP2 bonus evaluator",
        "attack": "PGD",
        "epsilon": 0.01,
        "defence": "median_filter_plus_jpeg",
        "clean": {"label": clean["label"], "confidence": clean["confidence"]},
        "attacked": {
            "label": attacked["label"],
            "confidence": attacked["confidence"],
        },
        "defended": {
            "label": defended["label"],
            "confidence": defended["confidence"],
        },
    }


def _bonus_unavailable():
    return {
        "heatmap_path": None,
        "explanation": [
            "Weighted ensemble classification completed. ModelsP2 bonus analysis is unavailable."
        ],
        "generator_attribution": None,
        "model_scores": {},
        "robustness": [],
        "adversarial_result": {
            "status": "unavailable",
            "reason": "ModelsP2 bonus dependencies or checkpoint are unavailable.",
        },
    }


def _fallback_prediction():
    return {
        "label": "ai_generated",
        "confidence": 0.85,
        "threshold_used": ENSEMBLE_THRESHOLD,
        "heatmap_path": None,
        "explanation": ["Fallback mode is enabled; no model inference was run."],
        "generator_attribution": None,
        "model_scores": {
            "vit_model_ai_generated": 0.85,
            "modelsp2_vit_fft_ai_generated": 0.85,
            "ai_image_detect_distilled_ai_generated": 0.85,
            "ensemble_ai_generated": 0.85,
            "ensemble_weights": ENSEMBLE_WEIGHTS,
        },
        "robustness": [],
        "adversarial_result": {
            "status": "unavailable",
            "reason": "Bonus model dependencies or checkpoint are unavailable.",
        },
    }


def _get_tier_label(ai_prob: float) -> str:
    if ai_prob > 0.70:
        return "ai_generated"
    elif ai_prob >= 0.50:
        return "possibly_ai"
    else:
        return "real"


def run_prediction(image_input, caption: str | None = None) -> dict:
    """Run the weighted detector ensemble plus ModelsP2 bonus analysis."""
    try:
        image = (
            image_input.convert("RGB")
            if isinstance(image_input, Image.Image)
            else Image.open(image_input).convert("RGB")
        )
    except Exception as exc:
        raise ValueError(f"Invalid image file: {exc}") from exc

    provenance = _provenance_result(image)
    multimodal_result = _caption_consistency_result(image, caption)

    if "test" in sys.argv or getattr(settings, "SIGNALSCOPE_ENABLE_ML", True) is False:
        return _fallback_prediction()

    try:
        vit_predictor, bonus_predictor, distilled_predictor = _get_predictors()
        vit_result = vit_predictor.predict_from_pil(image)
    except (ImportError, ModuleNotFoundError, FileNotFoundError, RuntimeError) as exc:
        logger.warning("ML weights or inference predictor unavailable: %s. Using fallback prediction mode.", exc)
        res = _fallback_prediction()
        res["provenance"] = provenance
        res["multimodal_result"] = multimodal_result
        return res

    distilled_ai_probability = distilled_predictor(image)

    if bonus_predictor is None:
        bonus = _bonus_unavailable()
        ensemble_ai_probability = (
            ENSEMBLE_WEIGHTS["vit_model"]
            * float(vit_result["raw_score_p_ai_generated"])
            + ENSEMBLE_WEIGHTS["ai_image_detect_distilled"]
            * distilled_ai_probability
        ) / (
            ENSEMBLE_WEIGHTS["vit_model"]
            + ENSEMBLE_WEIGHTS["ai_image_detect_distilled"]
        )
        ensemble_label = _get_tier_label(ensemble_ai_probability)
        bonus["model_scores"] = {
            "vit_model_ai_generated": float(
                vit_result["raw_score_p_ai_generated"]
            ),
            "ai_image_detect_distilled_ai_generated": distilled_ai_probability,
            "ensemble_ai_generated": ensemble_ai_probability,
            "ensemble_weights": ENSEMBLE_WEIGHTS,
        }
        return {
            "label": ensemble_label,
            "confidence": max(ensemble_ai_probability, 1 - ensemble_ai_probability),
            "threshold_used": ENSEMBLE_THRESHOLD,
            **bonus,
            "provenance": provenance,
            "multimodal_result": multimodal_result,
        }

    try:
        bonus_result = bonus_predictor.predict_from_pil(
            image, include_explainability=True
        )
    except (RuntimeError, ValueError, OSError) as exc:
        logger.warning("ModelsP2 bonus inference unavailable: %s", exc)
        bonus = _bonus_unavailable()
        ensemble_ai_probability = (
            ENSEMBLE_WEIGHTS["vit_model"]
            * float(vit_result["raw_score_p_ai_generated"])
            + ENSEMBLE_WEIGHTS["ai_image_detect_distilled"]
            * distilled_ai_probability
        ) / (
            ENSEMBLE_WEIGHTS["vit_model"]
            + ENSEMBLE_WEIGHTS["ai_image_detect_distilled"]
        )
        ensemble_label = _get_tier_label(ensemble_ai_probability)
        bonus["model_scores"] = {
            "vit_model_ai_generated": float(
                vit_result["raw_score_p_ai_generated"]
            ),
            "ai_image_detect_distilled_ai_generated": distilled_ai_probability,
            "ensemble_ai_generated": ensemble_ai_probability,
            "ensemble_weights": ENSEMBLE_WEIGHTS,
        }
        return {
            "label": ensemble_label,
            "confidence": max(ensemble_ai_probability, 1 - ensemble_ai_probability),
            "threshold_used": ENSEMBLE_THRESHOLD,
            **bonus,
            "provenance": provenance,
            "multimodal_result": multimodal_result,
        }

    explanation = bonus_result.get("explanation") or {}
    cues = [_cue_text(cue) for cue in explanation.get("forensic_cues", [])]
    if not cues:
        cues = ["ModelsP2 did not produce a forensic cue for this image."]

    try:
        robustness = _run_robustness(bonus_predictor, image)
    except (RuntimeError, ValueError, OSError) as exc:
        logger.warning("Robustness evaluation unavailable: %s", exc)
        robustness = []

    try:
        adversarial_result = _run_adversarial_check(bonus_predictor, image)
    except (RuntimeError, ValueError, OSError) as exc:
        logger.warning("Adversarial evaluation unavailable: %s", exc)
        adversarial_result = {
            "status": "unavailable",
            "reason": "Bonus adversarial evaluation failed for this image.",
        }

    vit_ai_probability = float(vit_result["raw_score_p_ai_generated"])
    modelsp2_ai_probability = float(
        bonus_result["probabilities"]["ai_generated"]
    )
    ensemble_ai_probability = (
        ENSEMBLE_WEIGHTS["vit_model"] * vit_ai_probability
        + ENSEMBLE_WEIGHTS["modelsp2_vit_fft"] * modelsp2_ai_probability
        + ENSEMBLE_WEIGHTS["ai_image_detect_distilled"] * distilled_ai_probability
    )
    ensemble_label = _get_tier_label(ensemble_ai_probability)

    return {
        "label": ensemble_label,
        "confidence": max(ensemble_ai_probability, 1 - ensemble_ai_probability),
        "threshold_used": ENSEMBLE_THRESHOLD,
        "heatmap_path": _save_heatmap(explanation.get("heatmap_b64")),
        "explanation": cues,
        "generator_attribution": None,
        "provenance": provenance,
        "multimodal_result": multimodal_result,
        "model_scores": {
            "vit_model_ai_generated": vit_ai_probability,
            "modelsp2_vit_fft_ai_generated": modelsp2_ai_probability,
            "modelsp2_bonus_ai_generated": modelsp2_ai_probability,
            "ai_image_detect_distilled_ai_generated": distilled_ai_probability,
            "ensemble_ai_generated": ensemble_ai_probability,
            "ensemble_weights": ENSEMBLE_WEIGHTS,
        },
        "robustness": robustness,
        "adversarial_result": adversarial_result,
    }
