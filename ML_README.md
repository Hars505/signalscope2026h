# SignalScope — ML Pipeline

Real vs AI-generated image detection: data pipeline, model, training,
calibration, evaluation, and a serving interface. Bonus checks are executable,
but unsupported bonus claims are reported as unavailable rather than presented
as measured results.

## 1. What's in this folder

```
ml/
├── data/
│   ├── raw/                     # your dataset goes here (see §2)
│   └── processed/                # generated: train.csv / val.csv / test.csv / data_report.json
├── src/
│   ├── data/
│   │   ├── make_dataset.py       # builds honest, stratified, leakage-free splits
│   │   └── preprocess.py         # ViT preprocessing + FFT frequency-branch features
│   ├── models/
│   │   ├── detector.py           # SignalScopeDetector (ViT + frequency branch + calibration)
│   │   └── baseline.py           # Phase-1 baseline (plain ViT, no frequency branch)
│   ├── utils/
│   │   ├── metrics.py            # ROC-AUC, macro-F1, accuracy, FPR, confusion matrix
│   │   └── calibration.py        # temperature scaling
│   └── api/
│       └── main.py               # standalone FastAPI serving microservice
├── model/
│   ├── train.py                  # full training pipeline (entry point)
│   ├── evaluate.py               # re-evaluate either saved checkpoint
│   ├── validate_bonuses.py        # measured bonus proxies and robustness sample
│   └── predict_interface.py       # REQUIRED single-image predict contract for backend
├── configs/
│   └── train_config.yaml         # all hyperparameters / paths live here
├── notebooks/
│   └── SignalScope_Colab_Training.ipynb   # train on Google Colab, save weights to Drive
├── report/                       # generated: metrics.json, model_report.md
└── requirements.txt
```

## 2. Dataset

**Expected raw layout** (put this under `ml/data/raw/`, or zip it and unzip
into Colab — see §5):

```
data/raw/
├── real/
│   └── <source_name>/*.jpg|png       # e.g. real/flickr/*.jpg
└── fake/
    ├── <generator_name_1>/*.jpg|png  # e.g. fake/stable-diffusion-xl/*.jpg
    ├── <generator_name_2>/*.jpg|png  # e.g. fake/midjourney-v6/*.jpg
    └── <generator_name_3>/*.jpg|png
```

- **Core dataset**: the CIFAKE-style dataset provided for the assignment
  (~100k images, real vs AI-generated). Drop it into `data/raw/` in the
  layout above (rename/group its folders by generator if it isn't already).
- **Optional supplement**: [GenImage](https://github.com/GenImage-Dataset/GenImage)
  can be mixed in for extra generator diversity — set `data.use_genimage: true`
  in `configs/train_config.yaml` and add a loader for it in
  `make_dataset.py::_load_all_data` if you use this (a stub load point is
  already there).
- **License**: use only datasets you have rights to redistribute/train on;
  check each source's license before mixing it in.

**Why the folder-per-generator structure matters:** `make_dataset.py` uses
the generator name to (a) stratify the 70/15/15 train/val/test split so
each split has a representative mix of generators, and (b) hold out 1–2
fake generators **entirely** for testing — this gives you an honest
"unseen-generator" AUC, not just an in-distribution number. A model that
only ever sees Stable Diffusion outputs in training and gets 99% AUC on more
Stable Diffusion outputs at test time tells you much less than one that's
also tested against a generator it's never seen.

Before a compliant run, use a non-empty validation split and set
`holdout_generators` to a positive value. The checked-in sample currently has
one synthetic generator and cannot produce a meaningful unseen-generator
score.

Run the split builder once your raw data is in place:

```bash
cd ml
python -m src.data.make_dataset --config configs/train_config.yaml
```

This writes `data/processed/{train,val,test}.csv` and
`data/processed/data_report.json` (class counts + which generators ended up
where).

## 3. Model

**SignalScopeDetector** (`src/models/detector.py`):

| Component | Details |
|---|---|
| Backbone | `google/vit-base-patch16-224`, fine-tuned end-to-end (fully unfrozen by default) |
| Frequency branch | Small 3-layer CNN over the image's log-magnitude FFT spectrum (224×224, 1-channel) → 128-d embedding. Many GAN/diffusion outputs leave periodic artifacts that show up in frequency space more clearly than in pixel space. |
| Fusion | Concatenate ViT CLS embedding (768-d) + frequency embedding (128-d) → MLP → 2 logits |
| Calibration | Post-hoc temperature scaling (single learned scalar) fit on the validation set after training, so confidence scores are meaningfully close to true probabilities |
| Output | `label` (`real` / `ai_generated`), calibrated `confidence`, per-class `probabilities` |

A **Phase-1 baseline** (`src/models/baseline.py`) is the same architecture
with `use_frequency_features=False` — plain ViT, no calibration — useful as
a fast sanity check before spending GPU time on the full model.

Toggle the frequency branch and other hyperparameters in
`configs/train_config.yaml`.

## 4. Training

Local / any machine with a GPU:

```bash
cd ml
pip install -r requirements.txt
python -m src.data.make_dataset --config configs/train_config.yaml   # build splits (once)
python model/train.py --config configs/train_config.yaml             # train
```

`train.py`:
1. Loads train/val/test splits.
2. Fine-tunes with AdamW + cosine LR decay, early-stopping on validation
   ROC-AUC (patience configurable).
3. Saves the best checkpoint during training.
4. Reloads the best checkpoint and fits temperature scaling on the
   validation set.
5. Evaluates the calibrated model on the test set — **overall** metrics and
   **unseen-generator** metrics separately.
6. Saves the final model to `train.final_model_path` (default
   `models/trained/signalscope-final/`) as `pytorch_model.bin` + `config.json`.

MLflow run tracking is on by default (`mlflow ui` to view runs locally); pass
`--no-mlflow` to skip it.

## 5. Training on Google Colab (recommended if you don't have a local GPU)

Use `notebooks/SignalScope_Colab_Training.ipynb`:

1. Upload the `ml/` folder to GitHub (or zip it and upload the zip to Google
   Drive) and your dataset as a zip to Drive.
2. Open the notebook in Colab, set **Runtime → Change runtime type → GPU**.
3. Run the cells top to bottom:
   - Mounts your Drive.
   - Pulls the code (from GitHub or your Drive zip — both paths are in the
     notebook, pick one).
   - Installs `requirements.txt`.
   - Unzips your dataset onto Colab's **local** disk (`/content/data`) —
     much faster than reading thousands of small files off Drive.
   - Rewrites the config's paths to point at `/content/...` for
     speed and at your Drive folder for anything that must persist.
   - Runs `make_dataset.py` then `train.py`.
   - **Copies the final trained model + metrics back into your Drive
     folder** — this is the step that means you keep the trained model
     even after the Colab runtime disconnects/recycles.
4. Download `models/trained/signalscope-final/` from Drive (via the Drive
   UI, or `files.download()` on a zipped copy — both are shown at the
   bottom of the notebook) and place it at
   `ml/models/trained/signalscope-final/` in your repo.

Colab specifics worth knowing:
- Free-tier Colab GPUs (T4) disconnect after periods of inactivity and have
  a session time limit (~12h) — training checkpoints to Drive periodically
  is the safety net; the notebook copies the *final* model at the end, so if
  you expect a long run, also periodically re-run the "copy to Drive" cell
  or reduce `num_epochs` / dataset size for a first pass.
- Keep the dataset itself on local Colab disk (`/content/...`), not Drive —
  Drive's per-file I/O overhead makes DataLoader workers painfully slow on
  large image folders.
- If you hit a CUDA OOM on T4, drop `train.batch_size` to 16 in the config
  cell before training.

## 6. Evaluation

Re-run evaluation on any saved checkpoint without retraining:

```bash
python model/evaluate.py --model_path models/trained/signalscope-final --config configs/train_config.yaml
python model/evaluate.py --model_path models/trained/baseline-final --model_type baseline --config configs/train_config.yaml
python model/validate_bonuses.py --limit 8
```

Reports (also written to `report/metrics.json`):

| Metric | Scope |
|---|---|
| ROC-AUC | overall + unseen-generator |
| Macro-F1 | overall + unseen-generator |
| Accuracy @ 0.5 | overall |
| False Positive Rate @ 0.5 | overall |
| Confusion matrix | overall |

## 7. Predict interface (contract with backend)

```python
from model.predict_interface import SignalScopePredictor

predictor = SignalScopePredictor("models/trained/signalscope-final")
result = predictor.predict_from_path("some_image.jpg")
# {
#   "label": "ai_generated",
#   "confidence": 0.93,
#   "calibrated": true,
#   "probabilities": {"real": 0.07, "ai_generated": 0.93}
# }
```

Also exposed as a standalone HTTP microservice:

```bash
MODEL_PATH=models/trained/signalscope-final uvicorn src.api.main:app --reload --port 8001
# POST /predict  (multipart file upload) -> same JSON shape as above
```

## 8. Bonus and submission evidence

- `model/validate_bonuses.py` writes `report/bonus_validation.json`.
- Explainability output is a proxy until ground-truth artefact annotations are
  available; it must not be described as an official faithfulness score.
- Generator attribution remains unavailable until a separately trained and
  evaluated attribution checkpoint is supplied.
- Add dataset source/license citations, a limitations section, and a 3-5 minute
  demo link to `report/model_report.md` before submission.

## 9. Licensing and originality

The repository currently uses the provided CIFAKE-style images only. Record the
exact source and license before adding public data such as GenImage. List any
third-party libraries or notebooks referenced and include an originality
declaration in the final submission.
