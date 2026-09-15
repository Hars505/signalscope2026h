# Backend & ML — SignalScope

> Tags: **[REQ]** stated in the problem statement · **[ASSUMPTION]** not stated, default chosen · **[RECOMMEND]** engineering choice · **[BONUS]** tied to modules A–G.

## Part 1 — Backend (Django + DRF)

### 1.1 Django Apps

```
/backend
  manage.py
  requirements.txt
  /config              ← Django project settings, urls.py, wsgi/asgi
  /accounts             ← auth: uses Django's built-in User model directly
  /scans                 ← Scan model, serializers, views, urls
  /ml                     ← thin DRF wrapper around /model/predict.py — no ML logic lives here
```

### 1.2 Models (`scans/models.py`)

```python
class Scan(models.Model):
    LABEL_CHOICES = [("real", "Real"), ("ai_generated", "AI-generated")]

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)  # null = guest scan
    image = models.ImageField(upload_to="scans/")
    label = models.CharField(max_length=20, choices=LABEL_CHOICES)
    confidence = models.FloatField()
    threshold_used = models.FloatField()
    generator_attribution = models.CharField(max_length=50, null=True, blank=True)   # Module B
    explanation_text = models.JSONField(null=True, blank=True)                        # list of cue strings, Module A
    heatmap_image = models.ImageField(upload_to="heatmaps/", null=True, blank=True)    # Module A
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "-created_at"])]


class DegradationTest(models.Model):   # only if Module C is built
    scan = models.ForeignKey(Scan, related_name="degradation_tests", on_delete=models.CASCADE)
    transform_type = models.CharField(max_length=30)   # "jpeg_recompress", "resize", "screenshot"
    confidence_after = models.FloatField()
```

### 1.3 Endpoints (`scans/urls.py` + `accounts/urls.py`)

| Method & path | Auth | Description |
|---|---|---|
| `POST /api/scan` | Optional (guest allowed) | Accepts image (+ optional caption), runs `ml.predict()`, persists a `Scan` row if user is authenticated, returns the result JSON |
| `GET /api/history` | Required | Returns the current user's scans, most recent first |
| `GET /api/history/<id>` | Required, owner-only | Returns one scan's full detail (for reopening from the sidebar) |
| `POST /api/auth/signup` | — | Create account (Django `User`) |
| `POST /api/auth/login` | — | Session or JWT (SimpleJWT) login |
| `POST /api/auth/logout` | Required | Invalidate session/token |
| `/admin/` | Django staff | Built-in Django Admin — customize `ScanAdmin`/`UserAdmin` to show per-user scan counts (FR-8) |

**Example `POST /api/scan` response:**
```json
{
  "id": 42,
  "label": "ai_generated",
  "confidence": 0.88,
  "threshold_used": 0.5,
  "heatmap_url": "/media/heatmaps/42.png",
  "explanation": [
    "Handle geometry is physically inconsistent",
    "Reflections don't match the light source"
  ],
  "generator_attribution": "diffusion-family",
  "created_at": "2026-09-13T10:15:00Z"
}
```
This mirrors the brief's own sample output shape [REQ, §5].

### 1.4 Settings Notes

- `django-cors-headers` restricted to the known frontend origin (`REQUIREMENTS.md` §8).
- `MEDIA_ROOT`/`MEDIA_URL` for uploaded images and generated heatmaps — local filesystem, no S3 dependency (`ARCHITECTURE.md` §4).
- File upload validators: MIME-type allowlist (`image/jpeg`, `image/png`) and a max size (e.g. 10MB) enforced in the serializer.
- `.env` for `SECRET_KEY`, `DEBUG`, DB URL — never committed (public repo requirement, `REQUIREMENTS.md` §8).
- DRF throttling class on the `/api/scan` view if rate limiting is added.

### 1.5 Admin Customization (`scans/admin.py`) — satisfies FR-8 with near-zero effort

```python
class ScanInline(admin.TabularInline):
    model = Scan
    extra = 0

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "is_active", "date_joined", "scan_count")

    def scan_count(self, obj):
        return obj.scan_set.count()
```

## Part 2 — ML Pipeline

### 2.1 Module Structure

```
/model
  train.py           ← offline training entrypoint
  dataset.py           ← dataset loading, split logic (seeded), augmentation
  calibration.py        ← temperature/Platt scaling fit + apply
  gradcam.py             ← Grad-CAM wrapper (Module A)
  predict.py              ← THE shared inference entrypoint + CLI (used by both Django and judges)
  evaluate.py              ← computes ROC-AUC (overall + unseen-split), macro-F1, confusion matrix, FPR@threshold
  weights/                  ← final model checkpoint (or a release-link placeholder if too large for git)
  config.py                  ← thresholds, paths, hyperparameters — single source of truth
```

### 2.2 `predict.py` contract (the single most important file for scoring)

```python
def predict(image: PIL.Image, caption: str | None = None) -> dict:
    """
    Returns:
      {
        "label": "real" | "ai_generated",
        "confidence": float,             # calibrated, 0-1
        "heatmap": PIL.Image | None,      # Module A
        "explanation": list[str] | None,   # Module A, grounded in heatmap regions only
        "generator_attribution": str | None,  # Module B
      }
    """
```

CLI wrapper (what a judge runs, [REQ §4.1/§7.1]):
```bash
python model/predict.py --image path/to/img.jpg
# → prints the dict above as JSON to stdout
```
This function must **never** import anything from the Django project — it has to run standalone in an env built purely from `requirements.txt`, independent of the web server, to satisfy the reproducibility gate.

### 2.3 Training Pipeline (`train.py`, run offline — not part of the web app)

1. Load the provided dataset (+ any cited public dataset, e.g. GenImage) via `dataset.py`.
2. Build a **generator-aware split**: hold out at least one entire generator sub-class from training/validation where the data spans multiple generators, so validation approximates the real unseen-generator condition — never available from a plain random split.
3. Fine-tune an ImageNet-pretrained backbone (ResNet-50/EfficientNet first; ViT as a stretch comparison) with augmentation including JPEG recompression, resize, mild blur, colour jitter.
4. Fit calibration (`calibration.py`: temperature or Platt scaling) on the held-out validation split.
5. Select and record one operating threshold, favoring lower FPR (a false "fake" on a real photo is the costlier error per the brief).
6. Export final weights to `/model/weights/`; log the run (backbone, augmentation, val AUC) to a simple CSV — a full experiment-tracking platform is unnecessary at this scale.

### 2.4 Evaluation (`evaluate.py`)

Computes and prints/report the mandatory metrics: overall ROC-AUC, unseen-generator-split ROC-AUC (simulated internally, since the real held-out set is never accessible), macro-F1, confusion matrix, accuracy and FPR at the chosen threshold. This script's output feeds directly into the one-page model report (`/report`) and the README's required metrics section.

### 2.5 Explainability (`gradcam.py`) — Module A

- Run Grad-CAM (or Score-CAM) over the final convolutional block to get a heat-map.
- Generate explanation text via a **templated**, region-grounded approach — map the highlighted region's location/texture statistics to a small fixed set of cue phrases (e.g. texture smoothness, edge irregularity, lighting mismatch) rather than a free-running LLM caption. This is the safest way to satisfy the faithfulness rubric (`REQUIREMENTS.md` §5), since the rubric explicitly penalizes fluent-but-wrong text over honest, hedged text.
- Never generate cue text unless the heat-map actually has a clear peak region — if not, fall back to a generic, honest statement ("No single region stood out; verdict is based on overall image statistics").

### 2.6 Data Leakage Guardrails [REQ, non-negotiable]

- The organizers' held-out set (including the small kickoff sample) must never appear in `dataset.py`'s training/validation loaders — keep it, if you have it at all, in a clearly separate, untouched directory that no training code path reads from.
- Document the exact split (seed, ratios, which generator classes were held out) in `config.py` and the model report.

### 2.7 Requirements File (`/model/requirements.txt` or a shared root one, `ARCHITECTURE.md` §7)

Pin exact versions, e.g.: `torch`, `torchvision`, `timm`, `pytorch-grad-cam`, `opencv-python`, `Pillow`, `scikit-learn` (for metrics), `numpy`. Keep this list as small as the pipeline actually needs — every extra dependency is another way to fail the 10-minute reproducibility gate.

## 3. Out of Scope for Backend & ML

A separate model-serving microservice, GPU inference clusters, MLflow/W&B tracking, Celery/async task queues for inference (synchronous is fast enough at this scale), C2PA/EXIF parsing unless Module D is actually pursued, and any code path that reads or trains on the organizers' held-out set.
