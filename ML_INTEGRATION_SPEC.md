# ML TEAM INTEGRATION SPECIFICATION & INTERFACE CONTRACT

> **Audience**: ML Engineers and autonomous AI coding agents developing the machine learning models.  
> **Status of Backend**: Complete, verified, and passing 30/30 unit & integration tests.  
> **Backend Bridge**: `app/backend/ml/predict_wrapper.py` (currently operating with mock fallback until real model is connected).

---

## 1. System Overview & Context

SignalScope is a media forensics platform designed to classify images as **real** or **AI-generated** while defending against unseen generator architectures and providing grounded explanations.

```
┌─────────────────────────────────────────────────────────────┐
│                       USER / CLIENT                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Multipart HTTP upload)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DJANGO BACKEND (READY)                   │
│  - accounts/ (Auth & JWT)                                   │
│  - scans/ (Scan Model, Storage, History API)                │
│  - config/ (CORS, Exceptions, Rate Limiting)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ calls run_prediction(image, caption)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               app/backend/ml/predict_wrapper.py             │
│  - Normalizes uploaded image to PIL.Image (RGB)             │
│  - Imports and invokes model.predict.predict()              │
│  - Saves output PIL heatmap into MEDIA_ROOT/heatmaps/       │
│  - Isolates web framework from model code                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ calls predict(image, caption)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                *YOU ARE BUILDING THIS LAYER*                │
│                     /model/predict.py                       │
│                     /model/train.py                         │
│                     /model/gradcam.py                       │
│                     /model/weights/                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Hard Constraints (Scoring Gates & Disqualification Rules)

1. **Standalone Execution Gate**: `model/predict.py` **must never import Django** or rely on any backend code. Organizers and judges will run `python model/predict.py --image <path>` in a clean python environment.
2. **Reproducibility Limit**: The model and inference pipeline must set up and run in **< 10 minutes** from clean clone.
3. **Data Leakage Rule**: You must **never train on the held-out test set**. Organizers test generalization against unseen generator distributions (e.g., trained on Stable Diffusion, evaluated on Midjourney-class outputs).
4. **Ethics Rule**: Do not train or evaluate on identifiable real individuals, and do not adjudicate political claims.

---

## 3. The Strict Interface Contract (`/model/predict.py`)

You must place your inference entrypoint at:
`model/predict.py`

### 3.1 Python Function Signature

```python
import PIL.Image

def predict(image: PIL.Image.Image, caption: str | None = None) -> dict:
    """
    Main inference interface called by the Django backend bridge.

    Args:
        image: PIL.Image.Image guaranteed to be in 'RGB' mode.
        caption: Optional string (claim/text associated with image, for Module E).

    Returns:
        dict matching the output schema defined below.
    """
```

### 3.2 Expected Return Dictionary Schema

Your `predict()` function must return a Python dictionary with the following keys:

| Key | Type | Requirement | Description / Valid Values |
|---|---|---|---|
| `label` | `str` | **MANDATORY** | Exactly `"real"` or `"ai_generated"` |
| `confidence` | `float` | **MANDATORY** | Probability between `0.0` and `1.0` (calibrated) |
| `threshold_used` | `float` | **MANDATORY** | Decision threshold used (e.g., `0.50` or FPR-tuned) |
| `heatmap` | `PIL.Image.Image` or `None` | **BONUS A** | RGB/RGBA PIL Image highlighting anomalous regions (Grad-CAM). Set to `None` if real or unconfident. |
| `explanation` | `list[str]` or `None` | **BONUS A** | List of short, grounded strings describing visual cues (e.g., `["Physical inconsistency in reflection", "Abnormal high-frequency noise in background"]`). |
| `generator_attribution` | `str` or `None` | **BONUS B** | Architecture family label if synthetic, e.g. `"diffusion-family"`, `"gan-family"`, or `None`. |

#### Example Return Value:
```python
{
    "label": "ai_generated",
    "confidence": 0.884,
    "threshold_used": 0.50,
    "heatmap": <PIL.PngImagePlugin.PngImageFile image mode=RGB size=512x512 at 0x...>,
    "explanation": [
        "Irregular texture distribution detected in frequency domain",
        "Edge discontinuity along object boundaries"
    ],
    "generator_attribution": "diffusion-family"
}
```

### 3.3 Standalone CLI Contract (Required for Judges)

`model/predict.py` must also be runnable from the shell directly:

```bash
python model/predict.py --image path/to/image.jpg [--caption "optional caption"]
```

**Stdout requirement**: Must print pure, valid JSON containing the returned dictionary (excluding the PIL object; heatmaps should either be saved locally or omitted in CLI JSON):

```json
{
  "label": "ai_generated",
  "confidence": 0.884,
  "threshold_used": 0.5,
  "explanation": [
    "Irregular texture distribution detected in frequency domain",
    "Edge discontinuity along object boundaries"
  ],
  "generator_attribution": "diffusion-family"
}
```

---

## 4. Recommended `/model` Directory Structure

```
/model
├── __init__.py
├── config.py             # Hyperparameters, model weights paths, threshold configs
├── dataset.py            # Dataset loaders, generator-aware splits, augmentations
├── model.py              # Neural network architecture (ResNet-50 / EfficientNet / ViT)
├── train.py              # Training loop, checkpoints saving
├── evaluate.py           # Evaluation script: ROC-AUC, macro-F1, confusion matrix
├── calibration.py        # Temperature scaling / Platt scaling calibration
├── gradcam.py            # Grad-CAM / Attention heatmap generator (Module A)
├── predict.py            # <--- THE CORE INTEGRATION FILE (see Section 3)
└── weights/              # Directory for model checkpoints (.pt, .pth, or .onnx)
    └── model_weights.pt
```

---

## 5. Engineering Priorities for the ML Team

### P0 — Core Classifier & Pipeline
1. **Backbone Selection**: Start with an ImageNet-pretrained backbone (e.g. `timm.create_model('resnet50', pretrained=True)` or `efficientnet_b0`). They learn frequency/texture artifacts rapidly.
2. **Generator-Aware Split**: In `dataset.py`, hold out at least one entire generator architecture from training (e.g., train on Stable Diffusion 1.5, validate on Midjourney / SDXL). Standard random split will give a false sense of accuracy.
3. **Data Augmentation**: Incorporate JPEG recompression (quality 60-95), resizing, Gaussian blur, and color jitter. This prevents the detector from overfitting to standard file headers and prepares the system for Module C (Robustness).
4. **Calibration**: Use `calibration.py` with temperature scaling on logits to ensure a 0.85 confidence actually corresponds to an ~85% likelihood.

### P1 — Explainability (Module A - Headline Bonus, 15 pts)
1. **Grad-CAM**: Apply Grad-CAM to the final convolutional/attention layer.
2. **Grounded Explanations**: Do NOT use an unconstrained generative LLM that hallucinates. Map heatmap peak locations, sharpness, and high-frequency spectral metrics to a structured dictionary of grounded cue phrases.
3. If confidence is near the threshold or the heatmap has no distinct peak, set `explanation=None` or provide an honest hedge: `["No single salient region detected; classification based on global spectral distribution"]`.

---

## 6. How to Verify Integration with Backend

Once `model/predict.py` is implemented:

1. Place your code in `/model/predict.py`.
2. Open terminal in `app/backend`:
   ```bash
   cd app/backend
   python manage.py test scans
   ```
3. Look at console output:
   - If backend successfully imports your model, it logs:  
     `Real ML predict module loaded successfully.`
   - If backend cannot find it, it logs:  
     `ML predict not found. Using mock fallback.`
4. Run live prediction through the backend API:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   Post an image to `http://127.0.0.1:8000/api/scan/` and check that the real model predictions appear in the returned JSON.

---

## 7. Dependencies Note

When choosing ML dependencies, stick to well-maintained packages to protect the Python 3.14 / cross-platform reproducibility gate:
- `torch`, `torchvision`
- `timm`
- `Pillow` (version >= 12.0 for Python 3.14)
- `numpy`, `scipy`, `scikit-learn`
- `opencv-python` (or `opencv-python-headless`)
