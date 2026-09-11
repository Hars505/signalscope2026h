import logging
import sys
import uuid
from pathlib import Path
from PIL import Image
from django.conf import settings

logger = logging.getLogger(__name__)

# Add project root to sys.path to locate /model/predict.py
REPO_ROOT = Path(settings.BASE_DIR).parent.parent
MODEL_DIR = REPO_ROOT / "model"
if str(REPO_ROOT) not in sys.path:
    sys.path.append(str(REPO_ROOT))
if MODEL_DIR.exists() and str(MODEL_DIR) not in sys.path:
    sys.path.append(str(MODEL_DIR))

_REAL_PREDICT_AVAILABLE = False
real_predict = None

try:
    from model.predict import predict as _imported_predict  # type: ignore
    real_predict = _imported_predict
    _REAL_PREDICT_AVAILABLE = True
    logger.info("Real ML predict module loaded successfully.")
except (ImportError, ModuleNotFoundError) as e:
    try:
        from predict import predict as _imported_predict  # type: ignore
        real_predict = _imported_predict
        _REAL_PREDICT_AVAILABLE = True
        logger.info("Real ML predict module loaded from model directory.")
    except (ImportError, ModuleNotFoundError) as e2:
        logger.warning("ML predict not found. Using mock fallback. (%s, %s)", e, e2)


def _mock_predict(image: Image.Image, caption: str | None = None) -> dict:
    """Mock fallback returning dummy inference data."""
    return {
        "label": "ai_generated",
        "confidence": 0.85,
        "threshold_used": 0.5,
        "heatmap": None,
        "explanation": ["Mock: texture anomaly detected"],
        "generator_attribution": "mock-diffusion",
    }


def save_heatmap_image(heatmap_img: Image.Image) -> str:
    """Saves PIL heatmap image into MEDIA_ROOT/heatmaps and returns relative storage path."""
    heatmap_dir = Path(settings.MEDIA_ROOT) / "heatmaps"
    heatmap_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.png"
    filepath = heatmap_dir / filename
    heatmap_img.save(filepath, format="PNG")
    return f"heatmaps/{filename}"


def run_prediction(image_input, caption: str | None = None) -> dict:
    """
    Inference entrypoint called by scan views.
    Accepts:
        image_input: PIL.Image.Image, Django UploadedFile, or file-like object
        caption: optional string claim/text
    Returns:
        dict:
            label: "real" | "ai_generated"
            confidence: float (0.0 - 1.0)
            threshold_used: float
            heatmap_path: str | None (relative path in media storage)
            explanation: list[str] | None
            generator_attribution: str | None
    """
    try:
        if isinstance(image_input, Image.Image):
            pil_image = image_input.convert("RGB")
        else:
            pil_image = Image.open(image_input).convert("RGB")
    except Exception as exc:
        logger.error("Failed to parse image input: %s", exc)
        raise ValueError(f"Invalid image file: {exc}")

    try:
        if _REAL_PREDICT_AVAILABLE and real_predict is not None:
            res = real_predict(pil_image, caption=caption)
        else:
            res = _mock_predict(pil_image, caption=caption)
    except Exception as exc:
        logger.error("Inference execution failed: %s", exc)
        raise RuntimeError(f"Model prediction failed: {exc}")

    heatmap_path = None
    heatmap_obj = res.get("heatmap")
    if isinstance(heatmap_obj, Image.Image):
        try:
            heatmap_path = save_heatmap_image(heatmap_obj)
        except Exception as exc:
            logger.error("Failed to save heatmap: %s", exc)

    return {
        "label": res.get("label", "real"),
        "confidence": float(res.get("confidence", 0.5)),
        "threshold_used": float(res.get("threshold_used", 0.5)),
        "heatmap_path": heatmap_path,
        "explanation": res.get("explanation"),
        "generator_attribution": res.get("generator_attribution"),
    }
