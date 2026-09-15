# SignalScope — Core Task Model Report

| Field | Value |
|---|
| Task | Binary real-vs-AI-generated image classification |
| Backbone | resnet50 (ImageNet-pretrained, two-phase fine-tuning) |
| Image size | 224x224 |
| Train / Val / In-domain-test sizes | 84000 / 18000 / 18000 |
| Unseen-generator proxy size | 0 (held-out generator: None) |
| Regularisation | dropout=0.4, weight_decay=0.0001, label_smoothing=0.05, augmentation (crop/flip/rotation/colour-jitter/JPEG re-compression/blur) |
| Early stopping | patience=3 epochs on validation ROC-AUC |
| Operating threshold | 0.5 |

## Metric & result

| Metric | In-domain test |
|---|
| ROC-AUC | 0.9883 |
| Macro-F1 | 0.9003 |
| Accuracy @ 0.5 | 0.9011 |
| FPR @ 0.5 | 0.1867 |

Pooled overall ROC-AUC (in-domain test): **0.9883**

Confusion matrix (in-domain test) — rows=actual, cols=predicted [real, ai_generated]:
```
[[7320 1680]
 [ 101 8899]]
```

## Data & split
- Core training data: CIFAKE (used).
- Held-out unseen-generator proxy: None — excluded entirely from train/val/test.
- Duplicate-image leakage check: Not applicable as only one dataset is used.

## Baseline
A frozen-ImageNet-backbone linear-probe baseline (phase-1-only, no fine-tuning) is available in
`report/training_history.csv` as the `phase1_head` rows — compare its epoch-1 val AUC against the
final fine-tuned model above to see the lift from phase-2 fine-tuning.

## Limitations
- No unseen-generator split is used in this run; the reported metrics are based solely on the in-domain test set.
- `QUICK_MODE`/per-class image caps in `CFG` reduce dataset size for Colab-friendly runtimes; a full run
  (raise `max_images_per_class_*`) should be used for the final submitted model.
- Real images are drawn from CIFAR-10 (32x32 upsampled); this distribution is the only "real" source. Domain shift may exist for other real image sources.
