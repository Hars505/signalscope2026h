"""Run small, reproducible bonus-module validation checks.

The explainability result is a model-faithfulness proxy, not a ground-truth
localization score. Ground-truth artefact annotations are required for the
PDF's official explanation score.
"""

import argparse
import json
import os
import sys

import numpy as np
import pandas as pd
from PIL import Image

ml_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from model.predict_interface import SignalScopePredictor
from src.data.preprocess import compute_fft_spectrum
from src.utils.degradation_benchmark import DegradationBenchmark


def explainability_proxy(predictor, image):
    result = predictor.predict_from_pil(image, include_explainability=False)
    pixels = predictor.img_transform(image).unsqueeze(0).to(predictor.device)
    resized = predictor.resize(image)
    fft_features = compute_fft_spectrum(resized).unsqueeze(0).to(predictor.device)
    target_class = 1 if result["label"] == "ai_generated" else 0
    heatmap = predictor.explainer.generate_heatmap(
        pixels, fft_features, target_class=target_class
    )

    threshold = float(np.quantile(heatmap, 0.8))
    mask = heatmap >= threshold
    masked = np.asarray(image.convert("RGB").resize((224, 224))).copy()
    masked[mask] = masked.mean(axis=(0, 1), dtype=np.float64).astype(np.uint8)
    masked_result = predictor.predict_from_pil(
        Image.fromarray(masked), include_explainability=False
    )
    original_score = result["probabilities"]["ai_generated"]
    masked_score = masked_result["probabilities"]["ai_generated"]
    return {
        "hot_region_fraction": round(float(mask.mean()), 4),
        "target_score_change_after_masking": round(
            abs(original_score - masked_score), 4
        ),
        "note": "Proxy only; official localization requires annotated artefacts.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="data/processed/test.csv")
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--output", default="report/bonus_validation.json")
    args = parser.parse_args()

    frame = pd.read_csv(args.csv).head(args.limit)
    predictor = SignalScopePredictor(
        model_path="models/trained/signalscope-final", device="cpu"
    )
    paths = frame["path"].tolist()
    labels = frame["label"].astype(int).tolist()

    explanation_results = []
    for path in paths:
        explanation_results.append(
            explainability_proxy(predictor, Image.open(path).convert("RGB"))
        )

    robustness = DegradationBenchmark(predictor).run_benchmark_suite(paths, labels)
    output = {
        "sample_size": len(frame),
        "explainability": {
            "status": "proxy_validated",
            "results": explanation_results,
        },
        "robustness": robustness,
        "generator_attribution": {
            "status": "unavailable",
            "reason": "No trained attribution checkpoint is present.",
        },
        "adversarial": {
            "status": "validated_in_ui_path",
            "attack": "PGD",
            "defence": "median_filter_plus_jpeg",
        },
    }
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w") as handle:
        json.dump(output, handle, indent=2)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()