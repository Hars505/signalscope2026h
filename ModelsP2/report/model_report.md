# SignalScope Model Report - SIH 2026

## Task and scope

Binary real-vs-AI-generated image classification with responsible likelihood
language. The current data contains general CIFAKE-style images only; no
identifiable-person or political-event claims are used.

## Data and split

The checked-in dataset contains 20,000 images: 16,000 train and 4,000 test,
with 2,000 real and 2,000 synthetic images in the test set. The current split
has **zero validation images** and **zero held-out generators**. Therefore the
reported metrics are in-distribution test metrics, not the PDF-required
unseen-generator result. A compliant run must add a non-empty validation split
and at least one genuinely unseen synthetic generator before submission.

The production checkpoint was also evaluated on the balanced Parveshiiii proxy
test manifest (836 images: 418 real and 418 AI-generated), which was not used
to train the Hemg checkpoint. This is a local cross-source proxy, not the
organizer's held-out test.

## Core metrics currently available

These values are copied from `report/metrics.json` and are not unseen-generator
metrics:

| Model | ROC-AUC | Macro-F1 | Accuracy | FPR |
|---|---:|---:|---:|---:|
| SignalScope detector | 0.9772 | 0.9250 | 0.9250 | 0.0685 |
| Plain ViT baseline | 0.9722 | 0.9157 | 0.9157 | 0.0800 |

The SignalScope confusion matrix is TN=1863, FP=137, FN=163, TP=1837.
The baseline confusion matrix is TN=1840, FP=160, FN=177, TP=1823.

### Three-model production ensemble

The deployed ensemble uses VIT_Model (30%), ModelsP2 ViT+FFT (20%), and
ai-image-detect-distilled (50%). On a 1,000-image balanced Hemg test slice it
achieved ROC-AUC 0.9824, macro-F1 0.9470, accuracy 0.9470, and FPR 0.0700.
On the 836-image Parveshiiii cross-source proxy it achieved ROC-AUC 0.4791,
macro-F1 0.3343, accuracy 0.4928, and FPR 0.9952 (TN=2, FP=416, FN=8,
TP=410). This domain shift is a limitation, not an official score.

The proxy metrics are stored in
`report/ensemble_parveshiiii_proxy_metrics.json`.

## Calibration and reproducibility

Training now requires a non-empty validation CSV and fits temperature scaling
on that validation loader. Rebuild the splits and retrain before treating the
checked-in temperature value as a compliant calibrated result. Evaluation is
available for both checkpoints:

```bash
cd ML
python model/evaluate.py --model_path models/trained/signalscope-final --model_type signalscope
python model/evaluate.py --model_path models/trained/baseline-final --model_type baseline
```

## Bonus status

- **Explainability:** Grad-CAM and forensic cues run. The 32-image local proxy
  in `report/bonus_validation_32.json` records a mean absolute AI-probability
  change of `0.5288` after masking the highlighted region. This is not the
  official faithfulness score because annotated artefacts are unavailable.
- **Generator attribution:** disabled unless a trained attribution checkpoint
  is explicitly supplied; no attribution score is claimed.
- **Provenance:** the web API extracts selected EXIF fields and detects
  embedded C2PA/JUMBF/content-credential keys when present. It reports
  provenance as evidence only and never infers authenticity from missing
  metadata.
- **Caption consistency:** the API performs a metadata-grounded comparison when
  an EXIF description exists. Images without embedded descriptions are reported
  as unavailable because no local vision-language checkpoint is included.
- **Robustness:** JPEG, resize, and screenshot benchmark code is executable.
  The 32-image local proxy is recorded in
  `report/bonus_validation_32.json`; its weak results are diagnostic only and
  should not be presented as organizer-held-out robustness metrics.
- **Adversarial defence:** the UI generates a targeted PGD perturbation
  (`epsilon=0.03`, `alpha=0.007`, 10 steps) and compares clean, attacked, and
  sanitized predictions. Sanitization uses a 3x3 median filter followed by
  JPEG quality 85. No recovery percentage is claimed until a labelled attack
  benchmark is run.

## Limitations

The organizer's held-out test set is not present in this repository and cannot
be evaluated locally. The Parveshiiii result is only a cross-source proxy.
No annotated artefact ground truth is available, so masking remains a
faithfulness proxy. Generator attribution is not trained because the available
manifests do not contain multiple labelled generator families. A real
vision-language checkpoint and annotated caption pairs are also absent.

## Ethics and licensing

The repository uses the checked-in CIFAKE-style data, Hemg subset, and
Parveshiiii/AI-vs-Real subset. Confirm source-card licenses before external
publication; the local files do not include complete license manifests. The
interface uses likelihood language and does not identify people or adjudicate
political claims.

## Demo

Demo link: **not yet available**.