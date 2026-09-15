# SignalScope

**SignalScope** is a responsible image-forensics platform for assessing
whether an image is likely real or AI-generated. It combines visual
classification, spatial explanations, frequency-domain evidence, robustness
checks, provenance signals, and an optional caption-consistency check.

The project was developed for the SIH 2026 **SignalScope** problem statement:
detect synthetic imagery, generalise to unseen generators, and explain the
verdict without making accusations about people or real-world events.

> **Important:** SignalScope reports likelihoods such as **Likely AI-generated**
> and **Likely real**. It is not an identity, political, or event-verification
> system, and missing metadata is not proof that an image is authentic.

## Problem and objectives

The core task is binary classification:

1. Accept one image.
2. Return `real` or `ai_generated` with a confidence score.
3. Report ROC-AUC, macro-F1, accuracy, false-positive rate, and a confusion
   matrix on a valid held-out evaluation set.
4. Measure generalisation to generators that were not used during training.

The deployed application also exposes the bonus analysis modules requested by
the problem statement:

| Module | SignalScope implementation |
|---|---|
| Core classification | Weighted VIT, ViT+FFT, and distilled ViT ensemble |
| Faithful explanation | Grad-CAM-style heatmap and forensic cue list |
| Generator attribution | Interface is reserved; no trained attribution checkpoint is claimed |
| Degradation robustness | JPEG, resize, blur, and screenshot-style diagnostics |
| Provenance and metadata | Selected EXIF and C2PA/JUMBF/content-credential indicators |
| Multimodal consistency | Conservative metadata-grounded caption consistency |
| Real-time/deployable interface | React drag-and-drop upload and Django inference API |
| Active defence analysis | PGD/adversarial test and active-defence diagnostics |

## Architecture

```text
Browser (React + Vite)
        |
        | multipart image + optional caption
        v
Django REST API
        |
        +-- image orientation, validation, resize, thumbnail
        |
        +-- VIT_Model                         10%
        +-- ModelsP2 ViT + FFT                80%
        +-- ai-image-detect-distilled         10%
        |
        +-- ensemble calibration and threshold 0.30
        +-- Grad-CAM, forensic cues, robustness, PGD
        +-- provenance and caption-consistency analysis
        |
        v
JSON verdict, confidence, explanation, heatmap, and diagnostics
```

### Repository layout

```text
.
├── Frontend&Backend/
│   └── app/
│       ├── backend/                 Django + DRF API
│       │   ├── scans/               upload, history, persistence
│       │   ├── ml/                  production inference adapter
│       │   └── manage.py
│       └── frontend/                React + Vite application
├── ModelsP2/                         ViT+FFT training and reports
├── VIT_Model/                        VIT_Model checkpoint and utilities
├── ai-image-detect-distilled/        distilled transformer checkpoint
├── COMPLIANCE_STATUS.md              requirement-by-requirement status
├── DATASET_LICENSES.md               dataset and third-party attribution
└── Startup Guide.md                  expanded local startup notes
```

## Quick start

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer and npm
- Git
- Optional but recommended: NVIDIA GPU with enough VRAM for the ensemble

The repository's local environment is `.venv` at the repository root. Use
another virtual environment if required by your deployment platform.

### Environment and dependency manifests

The project uses separate backend and frontend manifests rather than a single
root `requirements.txt`:

| Component | Manifest | Install command |
|---|---|---|
| Django/ML backend | [`Frontend&Backend/app/backend/requirements.txt`](Frontend&Backend/app/backend/requirements.txt) | `python -m pip install -r requirements.txt` |
| React/Vite frontend | [`Frontend&Backend/app/frontend/package.json`](Frontend&Backend/app/frontend/package.json) | `npm install` |

The backend manifest pins the Django/DRF service dependencies and declares the
PyTorch, Transformers, OpenCV, NumPy, SciPy, and Pillow runtime packages. The
frontend manifest pins the React, Vite, Tailwind, router, animation, and icon
packages. There is intentionally no second root dependency file that could
drift from these component manifests.

### 1. Install backend dependencies

```bash
cd Frontend\&Backend/app/backend
python -m pip install -r requirements.txt
```

On Linux/macOS, quote the directory name when changing into it:

```bash
cd "Frontend&Backend/app/backend"
python -m pip install -r requirements.txt
```

Apply migrations:

```bash
python manage.py migrate
```

### 2. Configure the backend

Create `Frontend&Backend/app/backend/.env` from the available example file if
needed. The important development values are:

```dotenv
DEBUG=True
FRONTEND_URL=http://localhost:5173
SIGNALSCOPE_ENABLE_ML=True
```

For deployment, set a strong `SECRET_KEY`, set `DEBUG=False`, configure
`ALLOWED_HOSTS`, use HTTPS, and serve media through a protected production
storage configuration.

### 3. Start Django

```bash
cd "Frontend&Backend/app/backend"
python manage.py runserver 8000
```

The API is available at `http://localhost:8000`. Documentation endpoints are:

- Swagger: `http://localhost:8000/api/docs/swagger/`
- ReDoc: `http://localhost:8000/api/docs/redoc/`
- OpenAPI schema: `http://localhost:8000/api/docs/schema/`

The first live scan can take longer because all model checkpoints load lazily.

### 4. Start the frontend

In a second terminal:

```bash
cd "Frontend&Backend/app/frontend"
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend uses live Django mode when:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

Mock mode is available for interface demonstrations without model inference.
It must not be used as evidence for the core ML metrics.

## Prediction API

### Upload and classify

```bash
curl -X POST http://localhost:8000/api/scan/ \
  -F "image=@/path/to/image.jpg" \
  -F "caption=optional generic caption"
```

The response includes:

```json
{
  "id": 1,
  "label": "ai_generated",
  "confidence": 0.88,
  "threshold_used": 0.30,
  "model_scores": {
    "vit_model": 0.72,
    "models_p2": 0.93,
    "distilled": 0.61,
    "ensemble": 0.86,
    "weights": {
      "vit_model": 0.10,
      "models_p2": 0.80,
      "distilled": 0.10
    }
  },
  "explanation": [],
  "heatmap_url": null,
  "degradation_tests": [],
  "provenance": {},
  "multimodal_result": {}
}
```

The exact fields depend on the image and on which optional analyses produce
usable evidence. A provenance absence or unavailable caption result is reported
explicitly rather than converted into a real/fake decision.

### History endpoints

- `GET /api/history/` — authenticated scan list
- `GET /api/history/<id>/` — authenticated owner-only scan detail

Guest uploads can be displayed from the browser's local cache, while
server-side history remains protected by authentication.

## Evaluation and reported results

The organizer-provided held-out set and its unseen-generator split are not
included in this repository. Therefore, no organizer score is claimed here.
The official evaluation must run against the organizer's private manifest
through the same prediction interface.

### Local data splits

The local experiments use separate manifests and do not replace the
organizer-held-out evaluation:

| Dataset/use | Train | Validation | Test/proxy | Class balance |
|---|---:|---:|---:|---|
| Hemg production training | 24,000 | 4,000 | 8,000 | Balanced real/AI |
| Parveshiiii continuation/proxy | 4,998 | 832 | 836 | Balanced real/AI |

The Parveshiiii test manifest is used as a cross-source proxy because it was
not used to train the continuation checkpoint. It is not a substitute for the
organizer's unseen-generator split.

### Model and calibration configuration

- Backbone: `google/vit-base-patch16-224`
- Input size: `224 x 224`
- ViT+FFT frequency embedding: 128 dimensions
- Classifier hidden layer: 512 units
- Dropout: 0.3
- Batch size: 32 with gradient accumulation of 2
- Training: 2 continuation epochs, learning rate `2e-5`, weight decay `0.01`,
  warmup ratio `0.1`, seed `42`
- Early stopping metric: validation ROC-AUC
- Calibration: post-hoc temperature scaling on the validation split; the
  recorded ModelsP2 temperature is `T=1.4546`
- Production operating threshold: `0.30`
- Training augmentation: resize to `224 x 224` followed by random horizontal
  flip; validation and test use deterministic resize only
- Normalization: ImageNet mean `[0.485, 0.456, 0.406]` and standard deviation
  `[0.229, 0.224, 0.225]`
- Frequency branch: grayscale 2-D FFT, shifted log-magnitude spectrum,
  normalized to `[0, 1]`

Training and evaluation configuration is in
[`ModelsP2/configs/train_config.yaml`](ModelsP2/configs/train_config.yaml).

### Reproducible local proxy evaluation

```bash
cd "Frontend&Backend/app/backend"
python ml/evaluate_ensemble.py \
  "../../../ModelsP2/data/parveshiiii_subset/processed/test.csv" \
  --output "../../../ModelsP2/report/ensemble_parveshiiii_proxy_metrics.json"
```

The current local cross-source proxy result for the production 10/80/10
ensemble is:

| Metric | Local proxy |
|---|---:|
| ROC-AUC | 0.9495 |
| Accuracy at threshold 0.30 | 0.8397 |
| Macro-F1 | 0.8373 |
| False-positive rate | 0.2823 |

Confusion matrix on that proxy:

```text
TN=300  FP=118
FN=16   TP=402
```

These values are useful for local regression testing, but they are **not** the
organizer's held-out score and must not be presented as the unseen-generator
leaderboard result. The full evidence and limitations are maintained in
[`COMPLIANCE_STATUS.md`](COMPLIANCE_STATUS.md) and
[`ModelsP2/report/model_report.md`](ModelsP2/report/model_report.md).

### Baseline comparison

On the local balanced Parveshiiii continuation test split, the current
ModelsP2 checkpoint and its plain ViT baseline reported:

| Model | ROC-AUC | Accuracy | Macro-F1 | FPR |
|---|---:|---:|---:|---:|
| ModelsP2 ViT+FFT | 0.9484 | 0.8672 | 0.8669 | 0.0813 |
| Plain ViT baseline | 0.9501 | 0.8900 | 0.8899 | 0.1244 |

The baseline has higher local accuracy and macro-F1 at its evaluated operating
point, while the ViT+FFT model has a lower false-positive rate. These are
checkpoint-level local results, not organizer results. The production
three-model ensemble is evaluated separately above.

### Bonus validation evidence

The checked-in bonus artifact is generated by
`ModelsP2/model/validate_bonuses.py` and is stored at
[`ModelsP2/report/bonus_validation_32.json`](ModelsP2/report/bonus_validation_32.json).
It confirms that the explanation masking path and PGD defence path execute.
The checked-in artifact uses a balanced 32-image local proxy sample. Mean
absolute AI-probability change after masking the explanation region is `0.5288`
on this sample; this is only a faithfulness proxy, not the official annotated
score.

The benchmark evaluates the following fixed transformations:

| Degradation | Settings |
|---|---|
| JPEG compression | Quality factors 90, 70, 50, 30, and 10 |
| Resize round-trip | Downscale/upscale at 75%, 50%, and 25% |
| Screenshot simulation | 8% crop, resize, contrast factor 1.05, JPEG quality 75 |

To regenerate the degradation and explanation artifact:

```bash
cd ModelsP2
# Use a balanced manifest with 16 real and 16 AI-labelled images.
python model/validate_bonuses.py \
  --csv /path/to/balanced_manifest_32.csv \
  --limit 32 \
  --output report/bonus_validation_32.json
```

The output contains an accuracy, macro-F1, and ROC-AUC row for clean input and
for every transformation above. The `--limit` value is recorded in the output
so the result cannot be mistaken for a full held-out benchmark.

Measured 32-image proxy results are:

| Condition | ROC-AUC | Accuracy | Macro-F1 |
|---|---:|---:|---:|
| Clean | 0.4434 | 0.5000 | 0.3333 |
| JPEG QF 90 | 0.4434 | 0.5000 | 0.3333 |
| JPEG QF 70 | 0.4609 | 0.5000 | 0.3333 |
| JPEG QF 50 | 0.4785 | 0.5000 | 0.3333 |
| JPEG QF 30 | 0.5000 | 0.5000 | 0.3333 |
| JPEG QF 10 | 0.5000 | 0.5000 | 0.3333 |
| Resize 75% | 0.5234 | 0.5000 | 0.3333 |
| Resize 50% | 0.5742 | 0.5000 | 0.3333 |
| Resize 25% | 0.6719 | 0.5938 | 0.5135 |
| Screenshot | 0.5000 | 0.5000 | 0.3333 |

These weak proxy values are reported as a limitation, not hidden. They show
that robustness needs a larger, representative benchmark and further
calibration before it can support a strong degradation claim.

### Active-defence settings and failure analysis

The adversarial path uses targeted PGD against the ModelsP2 detector:

| Parameter | Value |
|---|---:|
| Attack | Projected Gradient Descent |
| Target class | AI-generated (`1`) |
| Perturbation budget (`epsilon`) | `0.03` |
| Step size (`alpha`) | `0.007` |
| Iterations | `10` |
| Sanitization | 3x3 median filter, then JPEG quality 85 |
| Pixel clamp | Normalized range `[-3.0, 3.0]` |

The API stores clean, attacked, and defended predictions in
`adversarial_result`. This supports per-image failure analysis: a successful
attack is one that changes the verdict or materially changes the AI
probability; a defended case is one where sanitization restores or moves the
prediction toward the clean result. The repository does not claim a recovery
percentage until the attack is run across a labelled benchmark rather than a
single upload.

### Problem-statement coverage matrix

| PDF requirement | Evidence in this repository | Final status |
|---|---|---|
| Overall held-out ROC-AUC | Organizer manifest required; local proxy is reported separately | External run required |
| Unseen-generator ROC-AUC | Organizer generator labels/manifest required | External run required |
| Held-out macro-F1, accuracy, FPR, confusion matrix | Same organizer evaluation run | External run required |
| Baseline comparison | Local ModelsP2 vs plain ViT table above; rerun on organizer set | Local evidence complete |
| Exact train/validation/test sizes | Split table above and preparation manifests | Complete locally |
| Hyperparameters and augmentation | Configuration and preprocessing details above | Complete locally |
| Calibration methodology | Validation temperature scaling and `T=1.4546` above | Complete locally |
| Explanation faithfulness | Mean masking change `0.5288` on 32 images; official annotated scoring unavailable | Proxy only |
| Generator attribution metric | No trained attribution checkpoint | Not claimable |
| Degradation-vs-accuracy | Reproducible benchmark command and settings above | Ready to rerun |
| Active-defence failure analysis | PGD parameters and per-image API output above | Diagnostic; aggregate run required |

## Training data and licensing

The repository documents the known data sources and licensing uncertainties in
[`DATASET_LICENSES.md`](DATASET_LICENSES.md). The current local work includes:

- A CIFAKE-style real/synthetic baseline.
- A balanced Hemg subset used for ModelsP2 training.
- A balanced subset of `Parveshiiii/AI-vs-Real` used for continuation training
  and cross-source proxy evaluation.

The organizer-provided dataset remains the required source for the official
core evaluation. Any added public dataset must be cited, licensed for the
intended use, and kept separate from the organizer's held-out test data.

## Validation and development checks

Backend checks and tests:

```bash
cd "Frontend&Backend/app/backend"
python manage.py check
python manage.py test
```

Frontend production build:

```bash
cd "Frontend&Backend/app/frontend"
npm run build
```

## Known limitations

- The official organizer-held-out ROC-AUC and unseen-generator ROC-AUC cannot
  be computed without the private organizer manifest.
- Generator attribution is not claimed because a trained multi-generator
  checkpoint and suitable labelled data are not present.
- Explanation masking is a validation proxy; official faithfulness scoring
  requires the organizer's annotated artefacts.
- Caption consistency is metadata-grounded when an embedded description exists;
  it is not a general vision-language semantic judgement.
- Metadata can be missing, stripped, or forged. It is supporting evidence only.
- Cross-source performance varies by dataset and generator family; confidence
  should not be treated as certainty.
- Local development uses Django's development server and SQLite. Production
  deployment should use a production WSGI/ASGI server, persistent storage,
  HTTPS, secret management, and a production database.

## Submission evidence

- **One-page report:** [`ModelsP2/report/model_report.md`](ModelsP2/report/model_report.md)
- **Compliance matrix:** [`COMPLIANCE_STATUS.md`](COMPLIANCE_STATUS.md)
- **Dataset and originality notes:** [`DATASET_LICENSES.md`](DATASET_LICENSES.md)
- **Demo video:** [Watch the SignalScope website demo](https://drive.google.com/file/d/1emYaN1ZVg-sOZL75elun3UUbnpBArh9y/view?usp=drive_link)
- **Deployed application:** `TODO: add the final public URL`

The demo should show a new-image prediction, confidence and label,
explanation/heatmap, and any bonus modules being claimed. The originality
declaration should list the team's substantive work, third-party libraries,
pretrained checkpoints, dataset sources, and any referenced code.

### Official-results submission template

Complete these fields only after the organizer provides the held-out manifest
and the run is independently reproducible:

```text
Overall held-out ROC-AUC: TODO
Unseen-generator ROC-AUC: TODO
Held-out macro-F1: TODO
Held-out accuracy at stated threshold: TODO
Held-out false-positive rate: TODO
Held-out confusion matrix: TODO
Baseline comparison on the same held-out set: TODO
```

### Originality declaration template

```text
Team members: TODO
Development commit range (10–15 September 2026): TODO
Third-party libraries and licences: listed in dependency manifests
Pretrained checkpoints: VIT_Model, ModelsP2, ai-image-detect-distilled
Public datasets and source URLs/licences: listed in DATASET_LICENSES.md
Referenced code/notebooks: TODO, or “none”
Substantive original work: ensemble integration, API, frontend, evaluation
 tooling, provenance handling, robustness orchestration, and documentation.
```

## Responsible-use statement

SignalScope is an authenticity-assistance tool, not a final authority. Users
should preserve the original file, inspect provenance, compare independent
sources, and avoid taking harmful action based on one model result. The system
does not identify people, infer protected characteristics, or make claims
about political events or real-world allegations.
