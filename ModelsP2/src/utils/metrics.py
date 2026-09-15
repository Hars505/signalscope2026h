import json
import os
import numpy as np
from sklearn.metrics import (
    roc_auc_score,
    f1_score,
    accuracy_score,
    confusion_matrix
)


def compute_metrics(y_true, y_prob, threshold=0.5):
    """
    Computes standard classification metrics given true binary labels and positive class probabilities.
    y_true: np.array of 0 (real) and 1 (fake)
    y_prob: np.array of probabilities for class 1 (fake)
    """
    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    y_pred = (y_prob >= threshold).astype(int)

    # Handle single class edge case
    if len(np.unique(y_true)) > 1:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    else:
        roc_auc = 0.5

    macro_f1 = float(f1_score(y_true, y_pred, average='macro', zero_division=0))
    accuracy = float(accuracy_score(y_true, y_pred))

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    # False Positive Rate (flagging real photos as fake)
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    metrics = {
        "roc_auc": round(roc_auc, 4),
        "macro_f1": round(macro_f1, 4),
        "accuracy": round(accuracy, 4),
        "false_positive_rate": round(fpr, 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        }
    }
    return metrics


def compute_unseen_metrics(y_true, y_prob, is_unseen_flags, threshold=0.5):
    """
    Computes metrics specifically for unseen generators.
    """
    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    is_unseen = np.array(is_unseen_flags, dtype=bool)

    if not np.any(is_unseen):
        return {"status": "no_unseen_samples_in_eval"}

    unseen_y_true = y_true[is_unseen]
    unseen_y_prob = y_prob[is_unseen]

    return compute_metrics(unseen_y_true, unseen_y_prob, threshold=threshold)


def save_metrics(metrics_dict, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(metrics_dict, f, indent=2)
    print(f"Metrics saved to {output_path}")
