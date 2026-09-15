"""Evaluate the production ensemble on a labelled CSV manifest.

This is a local evaluation utility. It must not be described as the organizer's
held-out score unless the organizer supplies that manifest.
"""

import argparse
import csv
import json
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()

from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ml.predict_wrapper import ENSEMBLE_THRESHOLD, ENSEMBLE_WEIGHTS, _get_predictors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--output", type=Path, default=Path("ensemble_metrics.json"))
    args = parser.parse_args()

    rows = list(csv.DictReader(args.manifest.open()))
    vit, modelsp2, distilled = _get_predictors()
    y_true, y_prob = [], []
    for row in rows:
        path = Path(row["path"])
        if not path.is_absolute():
            path = Path("../../../ModelsP2") / path
        image = Image.open(path).convert("RGB")
        vit_prob = float(vit.predict_from_pil(image)["raw_score_p_ai_generated"])
        modelsp2_prob = float(
            modelsp2.predict_from_pil(
                image, include_explainability=False
            )["probabilities"]["ai_generated"]
        )
        distilled_prob = float(distilled(image))
        y_true.append(int(row["label"]))
        y_prob.append(
            ENSEMBLE_WEIGHTS["vit_model"] * vit_prob
            + ENSEMBLE_WEIGHTS["modelsp2_vit_fft"] * modelsp2_prob
            + ENSEMBLE_WEIGHTS["ai_image_detect_distilled"] * distilled_prob
        )

    y_pred = [int(prob >= ENSEMBLE_THRESHOLD) for prob in y_prob]
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    metrics = {
        "evaluation_type": "local_proxy_only",
        "manifest": str(args.manifest),
        "samples": len(rows),
        "weights": ENSEMBLE_WEIGHTS,
        "threshold": ENSEMBLE_THRESHOLD,
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro")), 4),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_ai": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall_ai": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "false_positive_rate": round(float(fp / max(1, tn + fp)), 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }
    args.output.write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
