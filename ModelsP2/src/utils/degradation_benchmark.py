import io
import os
import json
import numpy as np
from PIL import Image, ImageEnhance
import torch
from sklearn.metrics import roc_auc_score, f1_score, accuracy_score


def apply_jpeg_compression(image_pil, quality=50):
    """
    Simulates JPEG compression degradation at a specified quality factor (1-100).
    """
    buffer = io.BytesIO()
    image_pil.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    return Image.open(buffer).convert("RGB")


def apply_resizing(image_pil, scale=0.5):
    """
    Simulates downscaling and re-upscaling degradation.
    """
    w, h = image_pil.size
    new_w, new_h = max(16, int(w * scale)), max(16, int(h * scale))
    downscaled = image_pil.resize((new_w, new_h), Image.Resampling.BILINEAR)
    upscaled = downscaled.resize((w, h), Image.Resampling.BICUBIC)
    return upscaled


def apply_screenshot_simulation(image_pil, crop_ratio=0.08, jpeg_quality=75):
    """
    Simulates screenshot capture: slight boundary cropping, compression, and contrast shift.
    """
    w, h = image_pil.size
    crop_w = int(w * crop_ratio)
    crop_h = int(h * crop_ratio)
    cropped = image_pil.crop((crop_w, crop_h, w - crop_w, h - crop_h)).resize((w, h), Image.Resampling.BILINEAR)
    
    # Slight contrast shift
    enhancer = ImageEnhance.Contrast(cropped)
    cropped = enhancer.enhance(1.05)
    
    # Save as JPEG
    return apply_jpeg_compression(cropped, quality=jpeg_quality)


class DegradationBenchmark:
    """
    Comprehensive Degradation Benchmark Suite (Bonus C).
    Evaluates detector performance under JPEG compression, resizing, and screenshot artifacts.
    """
    def __init__(self, predictor):
        self.predictor = predictor

    def evaluate_image(self, image_pil, degradation_type="none", **kwargs):
        """
        Applies degradation to a single PIL image and returns model prediction.
        """
        if degradation_type == "jpeg":
            degraded_img = apply_jpeg_compression(image_pil, quality=kwargs.get("quality", 50))
        elif degradation_type == "resize":
            degraded_img = apply_resizing(image_pil, scale=kwargs.get("scale", 0.5))
        elif degradation_type == "screenshot":
            degraded_img = apply_screenshot_simulation(image_pil)
        else:
            degraded_img = image_pil

        res = self.predictor.predict_from_pil(degraded_img)
        return res

    def run_benchmark_suite(self, image_paths, labels):
        """
        Runs full benchmark suite on a dataset of images and true labels (0=real, 1=fake).
        Returns a dictionary of metrics per degradation level.
        """
        results = {}

        # 1. Clean Baseline (No Degradation)
        results["clean"] = self._eval_dataset(image_paths, labels, degradation_type="none")

        # 2. JPEG Compression Benchmarks (QF = 90, 70, 50, 30, 10)
        results["jpeg"] = {}
        for qf in [90, 70, 50, 30, 10]:
            results["jpeg"][f"qf_{qf}"] = self._eval_dataset(
                image_paths, labels, degradation_type="jpeg", quality=qf
            )

        # 3. Resizing Benchmarks (Scale = 0.75x, 0.50x, 0.25x)
        results["resize"] = {}
        for scale in [0.75, 0.50, 0.25]:
            results["resize"][f"scale_{int(scale*100)}"] = self._eval_dataset(
                image_paths, labels, degradation_type="resize", scale=scale
            )

        # 4. Screenshot Simulation Benchmark
        results["screenshot"] = self._eval_dataset(image_paths, labels, degradation_type="screenshot")

        return results

    def _eval_dataset(self, image_paths, labels, degradation_type="none", **kwargs):
        y_true = []
        y_prob = []

        for path, y in zip(image_paths, labels):
            try:
                img = Image.open(path).convert("RGB")
                res = self.evaluate_image(img, degradation_type=degradation_type, **kwargs)
                y_true.append(y)
                y_prob.append(res["probabilities"]["ai_generated"])
            except Exception as e:
                continue

        if len(y_true) == 0:
            return {"roc_auc": 0.5, "macro_f1": 0.0, "accuracy": 0.0}

        y_true = np.array(y_true)
        y_prob = np.array(y_prob)
        y_pred = (y_prob >= 0.5).astype(int)

        roc_auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.5
        macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
        acc = float(accuracy_score(y_true, y_pred))

        return {
            "roc_auc": round(roc_auc, 4),
            "macro_f1": round(macro_f1, 4),
            "accuracy": round(acc, 4)
        }
