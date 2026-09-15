# SignalScope — Core Task (Real vs AI-Generated Image Classification)

Telling Real From Synthetic in the Age of Generative Media — SIH 2026, Problem Statement 2.

This README documents the **core task only**: a real-vs-AI-generated image classifier trained with
transfer learning, evaluated for generalisation to unseen generators, and shipped with an
organizer-compatible `predict_interface.py`.

> The numbers in Section 4 are placeholders (`0.XXXX`) until you run the training notebook —
> `notebooks/SignalScope_Core_Training_Colab.ipynb` **automatically rewrites this section** with
> your actual run's metrics at the end of training (see Section 2, step 6). Numbers currently
> shown below are illustrative only.

---

## 1. Core module built

- ✅ **Core**: Real vs AI-generated image classification with calibrated confidence and a fixed
  operating threshold, evaluated on both an in-domain held-out split and a held-out
  **unseen-generator** proxy split.
- Bonus modules (explanation, attribution, robustness, provenance, multimodal, deployment,
  adversarial analysis) are out of scope for this deliverable.

## 2. Setup and run instructions (Google Colab)

1. Open `notebooks/SignalScope_Core_Training_Colab.ipynb` in Google Colab.
2. `Runtime → Change runtime type → GPU` (T4 or better).
3. Get a Kaggle API token: kaggle.com → **Account** → **Create New API Token** → downloads
   `kaggle.json`.
4. Run all cells top to bottom:
   1. Environment setup (installs/imports, GPU check).
   2. **`CONFIG`** — the only cell you typically need to edit (dataset choices, which GenImage
      generator is held out as the "unseen" proxy, image caps for a quick run, backbone, epochs).
   3. Upload `kaggle.json` when prompted.
   4. Datasets download automatically from Kaggle (see Section 3 for exact sources).
   5. Manifest build + leakage check → train/val/in-domain-test/unseen-generator splits.
   6. Training (two-phase transfer learning with early stopping) → evaluation → **this step
      overwrites the metrics table in Section 4 of this README with real numbers**.
   7. Packaging: everything below is zipped and downloaded as `signalscope_model_package.zip`.
5. A judge should be able to reproduce a single prediction in well under 10 minutes using the
   packaged `predict_interface.py` + `best_model.pt` (no retraining required):

```python
from predict_interface import SignalScopePredictor
predictor = SignalScopePredictor("best_model.pt", backbone="resnet50")
predictor.predict("/path/to/some_image.jpg")
# -> {"label": "ai_generated", "confidence": 0.91, "raw_score_p_ai_generated": 0.91}
```

## 3. Datasets used and their sources/licences

| Dataset | Role | Original / authoritative source | Size used | Licence |
|---|---|---|---|---|
| **CIFAKE** | Core provided-style dataset (real = CIFAR-10, fake = Stable Diffusion v1.4) | Kaggle: [`birdy654/cifake-real-and-ai-generated-synthetic-images`](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images) — Bird, J.J. & Lotfi, A. (2024), *CIFAKE: Image Classification and Explainable Identification of AI-Generated Synthetic Images*, IEEE Access. Real images sourced from Krizhevsky & Hinton (2009), *Learning Multiple Layers of Features from Tiny Images* (CIFAR-10). | 100,000 train (50k/class) + 20,000 test (10k/class), 32×32 px | **CC BY 4.0** — attribution required; cite both Bird & Lotfi (2024) and Krizhevsky & Hinton (2009) |
| **GenImage** (train subsets: Stable Diffusion v1.4, Stable Diffusion v1.5, BigGAN) | Added public training data for generator diversity (diffusion + GAN families) | Zhu, M. et al. (2023), *GenImage: A Million-Scale Benchmark for Detecting AI-Generated Image*, NeurIPS 2023. Original distribution via ModelScope/Baidu Netdisk/OneDrive (see [GenImage GitHub](https://github.com/GenImage-Dataset/GenImage)); this pipeline uses the community Kaggle re-hosting split by generator family: [`vtphatt2/GenImage-*`](https://github.com/vtphatt2/GenImage-mirror) (mirrors the same files for scripted access). | Configurable per-class cap (default 6,000/class/generator in quick mode) | **CC BY-NC-SA 4.0** — non-commercial use only, attribution required, share-alike on derivatives |
| **GenImage** (held-out subset: ADM, configurable) | **Unseen-generator proxy** — excluded entirely from training; used only to estimate generalisation to a generator never seen in training | Same source as above (`vtphatt2/GenImage-ADM`) | Configurable per-class cap (default 1,500/class) | Same as above (CC BY-NC-SA 4.0) |

**Important distinctions:**
- The organizers' *actual* held-out judging set (Section 4 of the problem statement) is separate
  from anything above and is never available to teams — it is only evaluated by the organizers
  through `predict_interface.py`. The "unseen-generator proxy" here is our own local stand-in
  (one full GenImage generator family withheld from training) used to sanity-check generalisation
  before submission.
- No images of real, identifiable people are used or scraped; both datasets consist of generic
  scene/object/photo content (CIFAR-10 classes; ImageNet-style classes in GenImage).
- Because GenImage is licensed CC BY-NC-SA 4.0, any public deployment or commercial use of a model
  trained on it must respect the non-commercial and share-alike terms; for a submission that stays
  within the hackathon's non-commercial evaluation, this is compliant. If further public use is
  planned, verify the current terms on the sources above, since dataset hosting/mirrors can move.

## 4. Reported metrics

*(auto-filled by the notebook's Section 13 — placeholders shown below)*

| Metric | Overall (pooled) | In-domain test | Unseen-generator split |
|---|---|---|---|
| ROC-AUC | 0.XXXX | 0.XXXX | 0.XXXX |
| Macro-F1 | — | 0.XXXX | 0.XXXX |
| Accuracy @ threshold (0.5) | — | 0.XXXX | 0.XXXX |
| FPR @ threshold (0.5) | — | 0.XXXX | 0.XXXX |

**Confusion matrix — in-domain test** (rows = actual, cols = predicted):

| | Predicted Real | Predicted AI-generated |
|---|---|---|
| **Actual Real** | TN | FP |
| **Actual AI-generated** | FN | TP |

**Confusion matrix — unseen-generator split** (rows = actual, cols = predicted):

| | Predicted Real | Predicted AI-generated |
|---|---|---|
| **Actual Real** | TN | FP |
| **Actual AI-generated** | FN | TP |

Exact values are written to `report/metrics.json` and `report/model_report.md` on every run, and
the confusion-matrix / ROC plots are saved as `report/confusion_matrices.png` and
`report/roc_curves.png`.

## 5. Architecture overview, robustness/calibration approach, and known limitations

**Architecture:** ImageNet-pretrained CNN backbone (ResNet-50 by default; EfficientNet-B0
selectable in `CONFIG`) with a dropout + linear classification head, trained in two phases
(frozen-backbone head training, then low-LR fine-tuning of the last backbone block).

**Anti-overfitting measures** (this task saturates to 98%+ *training* accuracy very quickly, so
these are treated as first-class requirements, not afterthoughts):
- Two-phase transfer learning instead of full end-to-end fine-tuning from epoch 1.
- Weight decay (AdamW) + dropout in the classifier head + label smoothing on the loss.
- Augmentation designed to remove generator-specific shortcuts: random crop/flip/rotation, colour
  jitter, random JPEG re-compression, occasional Gaussian blur.
- Early stopping on **validation ROC-AUC** (not training accuracy/loss), with model-selection
  checkpointing on the best validation epoch.
- An automated train/val AUC-gap check and a post-hoc "shortcut learning" sanity check that flags
  suspiciously high in-domain AUC paired with a large drop on the unseen-generator split.
- An explicit **duplicate-image leakage check** between the training pool and the held-out
  unseen-generator pool (GenImage frequently reuses the same real photos across generator
  subsets), so the unseen split can't be inflated by memorised real images.

**Calibration:** confidence is reported as sigmoid output at a fixed 0.5 operating threshold;
the notebook computes accuracy and FPR at this threshold explicitly, since a false "AI-generated"
flag on a real photo is treated as the costlier error type per the problem statement.

**Known limitations:**
- The unseen-generator proxy is drawn from GenImage, not from a truly novel/undisclosed generator
  — it approximates, but does not replace, the organizers' real held-out test.
- Real images span two visually different "real" distributions (32×32 CIFAR-10 upsampled vs.
  full-resolution ImageNet photos in GenImage); residual confusion-matrix errors often trace back
  to this domain gap rather than to fake-detection failure — see `model_report.md` after a run for
  specifics on which split each error concentrates in.
- Default per-class image caps (`CFG.max_images_per_class_*`) are set for Colab-friendly runtimes;
  raise them for the final submitted model and expect a longer training time.

## 6. Repository layout (this deliverable)

```
├── README.md                                  # this file
├── notebooks/
│   └── SignalScope_Core_Training_Colab.ipynb  # full Colab pipeline (download → train → evaluate → package)
└── signalscope_model_package/                 # produced by the notebook, downloaded as a .zip
    ├── best_model.pt
    ├── predict_interface.py
    ├── model_report.md
    ├── metrics.json
    ├── training_history.csv
    ├── training_curves.png
    ├── roc_curves.png
    ├── confusion_matrices.png
    ├── manifest_train.csv / manifest_val.csv / manifest_test.csv / manifest_unseen.csv
    └── config_used.json
```

## 7. Citations

- Bird, J.J. and Lotfi, A. (2024). *CIFAKE: Image Classification and Explainable Identification of
  AI-Generated Synthetic Images.* IEEE Access.
- Krizhevsky, A. and Hinton, G. (2009). *Learning Multiple Layers of Features from Tiny Images.*
- Zhu, M., Chen, H., Yan, Q., Huang, X., Lin, G., Li, W., Tu, Z., Hu, H., Hu, J., Wang, Y. (2023).
  *GenImage: A Million-Scale Benchmark for Detecting AI-Generated Image.* NeurIPS 2023.
