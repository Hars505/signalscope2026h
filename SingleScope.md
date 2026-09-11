## PROBLEM STATEMENT - 2

## SIGNALSCOPE

Telling Real From Synthetic in the Age of Generative Media

| Domain | Technology | Target Users | Challenge Level |
| --- | --- | --- | --- |
| AI / Media Forensics / Trust & Safety | Computer Vision • Multimodal ML • GenAI (explanations) | Journalists, platforms, fact-checkers, everyday users | Advanced (above- average difficulty) |

## 1. Background

Text-to-image models can now produce photorealistic images in seconds. This unlocks enormous creative value - and a serious trust problem: synthetic images are increasingly used for misinformation, fraud, fake product listings, and manipulated “evidence.” Detecting AI-generated imagery, and explaining that judgement in terms a non-expert can act on, is one of the defining trust-and-safety challenges of the moment. It is also genuinely hard: detectors that ace images from generators they have seen often fail on images from a new, unseen generator - exactly the situation that matters in the real world, where new models appear constantly.

## Scope & ethics - read first.

This challenge is about detecting AI-generated / synthetic imagery in general (scenes, objects, art, product shots). It is NOT about face-swap deepfakes of real, identifiable people, and NOT about political claims or real-world events. The provided datasets contain no targeted individuals. Do not build features that identify, profile, or make claims about specific real people, and do not source your own images of identifiable individuals. Submissions that do so are disqualified. Frame outputs as likelihood assessments (“likely AI- generated”), never accusations.

## 2. Core Problem Statement

Build a system that classifies an input image as real or AI-generated, reports its performance on a held-out test set we provide (which includes images from generators not seen during training), and - as the headline bonus - produces a clear, faithful explanation of the visual cues behind its verdict. You may then extend it into a broader authenticity checker using the optional bonus modules in Section 3.2.


## 3. Challenge Structure: Core + Bonus

## 3.1 Mandatory Core Task (required of every team)

- Real-vs-AI-generated image classification. Accept a single image and output a label (real / AI-generated) plus a confidence score. Report standard metrics on the provided held-out test set (Section 4), including performance on the unseen-generator portion.

- Minimum bar. A trained model (transfer learning encouraged), an honest train/validation/test split, reported ROC-AUC and macro-F1 on the held-out set with a confusion matrix, and a minimal interface (web app, notebook UI, or CLI + screenshots) that runs a prediction on a new image.

A submission that does not deliver the core task is considered incomplete regardless of how many bonus modules it includes.

## 3.2 Optional Bonus Modules (each adds points - build any, all, or none)

| Bonus Module | What it adds |
| --- | --- |
| A. Faithful Explanation (headline) | For each verdict, produce a human-readable explanation of the cues (e.g. implausible textures, warped text, lighting/shadow inconsistencies, anatomical errors), ideally with a visual heat-map. Scored on faithfulness and usefulness, not fluency (Section 4.3). |
| B. Generator Attribution | Go beyond real/fake to name the likely generator family (e.g. GAN vs diffusion, or a specific model). Report a separate metric for this multi-class task. |
| C. Robustness to Degradation | Maintain accuracy when images are JPEG-compressed, resized, screenshotted, or lightly edited - the real-world conditions detectors usually break on. Show a degradation-vs-accuracy analysis. |
| D. Provenance & Metadata | Read and use signals such as C2PA / Content Credentials or EXIF where present, and explain how you combine metadata evidence with the model's visual verdict. |
| E. Multimodal (image + text) | Given an image plus its caption/claim, assess consistency (does the text match the image?) as an added authenticity signal. Text is generic captions - not political claims about real events. |
| F. Real-Time / Deployable | Ship a usable interface: drag-and-drop, batch scan, or a browser extension mockup, with sensible latency and a clear “likely AI-generated” presentation that avoids over-claiming. |
| G. Active Defence Analysis | Study how easily your detector is fooled (simple adversarial or post-processing attacks) and what mitigations help. Present the failure analysis honestly. |


## 4. Provided Data & Evaluation Protocol

To make scoring objective and comparable across all teams, the core task uses a standardized dataset and a held-out test set. The test set includes images from generators absent from the training data, so the primary metric measures generalisation - which is what makes the challenge above-average and copy-resistant (public notebooks tuned to one dataset will not top the leaderboard).

## 4.1 The dataset & the deliberate difficulty

|   | Training / validation | Held-out test |
| --- | --- | --- |
| Source | A provided real-vs-synthetic set (CIFAKE-style: real photos + images from a disclosed set of generators such as Stable Diffusion). MIT/open-licensed and released at kickoff. | A separate, unseen set that includes BOTH held-out real photos AND synthetic images from generators NOT in the training set (e.g. a newer diffusion model / Midjourney-class output). |
| Scale | ~100k+ labelled images (balanced real/fake), enough to train a solid transfer-learning model in the time available. | Used only during judging; a small public sample is shared at kickoff for format checks. The unseen-generator split is the key differentiator. |
| Role | Train and validate here. You may add other PUBLIC synthetic-image datasets (e.g. GenImage) - cite them. | Never train on it. Your reported core metric is computed here, by organizers, via your predict interface. |

## 4.2 Primary metric (core task)

- ROC-AUC on the held-out set is the primary ranking metric, reported overall AND separately on the unseen-generator split (the unseen-split AUC carries the most weight). Macro-F1 and a confusion matrix are also required.

- AUC is used alongside a fixed operating point (report accuracy and false-positive rate at a stated threshold), because in practice wrongly flagging a real photo as fake is costly.

## Data rules for the core task.

You may add extra PUBLIC synthetic-image data to your TRAINING set (cite it) and use any public data for bonus modules. But the core task is always evaluated on the organizers' held-out set via your predict interface. Training on the held-out set, or substituting your own test data for the core score, is non-compliant and forfeits the AI/ML axis. Do not scrape images of real, identifiable people.


## 4.3 Scoring the explanation bonus (Module A)

Because free-text explanations can be fluent but wrong, the explanation bonus is scored on faithfulness, not eloquence, using a small rubric applied by judges to a fixed sample of each team's outputs:

| Dimension | What earns points |
| --- | --- |
| Correctness | Do the cited cues actually correspond to real artefacts in the image, verified against provided ground-truth annotations on the sample set? |
| Localisation | Does a heat-map / region highlight point to the genuinely anomalous area rather than the whole image? |
| Usefulness | Would a non-expert understand and be able to act on the explanation? Is uncertainty communicated honestly? |
| No over-claiming | Explanations avoid fabricated certainty and never assert claims about real individuals or events. |


## 5. Example Scenario (illustrative)

A user drops in a suspicious product photo. The core classifies it; if bonus modules are present, the tool explains its reasoning, names the likely generator family, and stays robust to the fact that the image is a compressed screenshot.

| Input | Example |
| --- | --- |
| Image | A 512×512 product photo, saved as a re-compressed screenshot |
| Optional caption (Module E) | “Handmade ceramic mug, brand new” |

## Sample Output

- Verdict (core): Likely AI-generated - confidence 0.88 (AUC-calibrated).

- Explanation (bonus A): Handle geometry is physically inconsistent; reflections don't match the light source; highlighted regions shown on heat-map.

- Attribution (bonus B): Artefact pattern consistent with a diffusion-family generator.

- Robustness note (bonus C): Verdict stable after re-compression; confidence reduced by 0.04.

## 6. AI / Technology Expectations

| Technology | Where it fits |
| --- | --- |
| Computer Vision (core) | Real-vs-synthetic image classification. Transfer learning (CNN or ViT backbone) and frequency/artefact-based features are encouraged. |
| Robustness / Generalisation | Augmentation, domain adaptation, and calibration to survive the unseen- generator split and degraded images. |
| Explainable AI | Saliency / Grad-CAM style localisation and grounded natural-language explanation for the headline bonus. |
| Multimodal / GenAI | Image-text consistency and language generation for explanations. Grounded, verifiable statements score higher than fluent guesses. |
| Provenance tooling | C2PA / Content Credentials and EXIF parsing (optional Module D). |


## 7. Submission Contract (GitHub)

All teams submit a single public GitHub repository link. A submission is judged only if it meets the requirements below. Reproducibility is a scored gate: if judges cannot run or verify your core task, the AI/ML axis cannot be awarded in full.

## 7.1 Required repository structure

- /README.md - the entry point (see 7.2).

- /src or /app - source code.

- /model - training/inference code and the required predict interface from Section 4.1 (weights via release/link if large).

- /report - the one-page model report (7.3), plus explanation samples if attempting Module A.

- requirements.txt / environment file and clear run instructions.

## 7.2 Required README contents

- 1. Which core + bonus modules you built.

- 2. Setup and run instructions (a judge must reproduce a prediction in under ~10 minutes).

- 3. Datasets used and their sources/licences (core = provided dataset; list any added public data).

- 4. Reported metrics: overall AUC, unseen-generator-split AUC, macro-F1, confusion matrix.

- 5. Architecture overview, robustness/calibration approach, and known limitations.

- 6. Link to the demo video (7.4) and any deployed app.

## 7.3 Required model report (one page)

| Field | What to state |
| --- | --- |
| Task | Binary real-vs-AI-generated (plus any bonus tasks attempted). |
| Data & split | Sources, sizes, exact train/val/test split (core uses provided data; disclose any added public data). |
| Model / approach | Backbone, key hyperparameters, augmentation, calibration. |
| Metric & result | Overall AUC + unseen-split AUC (primary), macro-F1, accuracy & FPR at your chosen threshold, confusion matrix. |
| Baseline | The provided baseline and how you compare, especially on the unseen split. |
| Limitations | Honest failure cases (which generators / degradations break it). |

## 7.4 Demo video (primary evidence)

- A 3–5 minute recorded demo (unlisted link is fine) is the primary demonstration for all teams. It must show the core running on a new image, plus any bonus modules.


## 8. Originality & Timeframe Rules

- All substantive work must be committed between 10–15 September. Commit history must reflect real development during the window; pre-built repos are disqualified.

- Open-source libraries, pretrained backbones, and public datasets are allowed and encouraged - cite them in the README.

- Copying a public real-vs-fake notebook wholesale is prohibited. Include an originality declaration listing any third-party code or notebooks referenced.

- AI coding assistants may be used; the working system and its evaluation are what get scored.

- Respect the scope & ethics rules (Section 1): no targeting of real individuals, no political-claim adjudication.


## 9. Evaluation Criteria (100 points)

| Parameter | Weight | Scoring anchors |
| --- | --- | --- |
| AI/ML Implementation | 25 | Primarily the held-out AUC - weighted toward the unseen-generator split - mapped to published bands anchored to the baseline, plus method soundness (honest split, no leakage, calibration, correct metric reporting). |
| Technical Implementation | 20 | Reproducibility (does it run from the README?), code quality/structure, robustness engineering, and deployment. Gated: unreproducible core = capped score. |
| Innovation & Creativity | 15 | 12–15 = novel detection/explanation approach or strong generalisation idea; 7–11 = thoughtful extension of known methods; 0–6 = standard tutorial-level solution. |
| Explanation & Trust Impact | 15 | Scored via the faithfulness rubric (4.3). 12–15 = correct, localised, honestly-hedged explanations; 7–11 = mostly correct but weak localisation; 0–6 = fluent but unfaithful or over-claiming. |
| User Experience | 10 | Clarity of the verdict, responsible presentation (“likely” not “certain”), accessibility, and overall usability shown in the demo. |
| Problem Understanding | 10 | Grasp of the generalisation problem, appropriate module choices, and honest limitations in the report. |
| Presentation & Demo | 5 | Clarity and completeness of the 3–5 min video (and live demo for the shortlist). |
| TOTAL | 100 |   |

## 10. Tie-Break & Shortlisting

To produce a clean cut, ties and near-ties are resolved in this fixed order:

- 1. Unseen-generator-split AUC on the held-out test set (higher wins).

- 2. Overall held-out AUC.

- 3. Reproducibility - did the core run cleanly from the README?

- 4. Explanation faithfulness score, then depth of other bonus modules (verified, not merely present).

## 11. Innovation Opportunities

Directions that historically differentiate strong teams (all optional):

- Frequency-domain / artefact-based features that generalise across generators

- Calibrated confidence so “not sure” is an honest output

- Grad-CAM / attention heat-maps tied to specific artefact types

- Robustness to compression, resizing, and screenshotting

- Generator attribution (GAN vs diffusion vs specific model)

- C2PA / Content Credentials provenance integration


- Lightweight, on-device or browser-extension deployment

- Human-in-the-loop review workflow for platforms/newsrooms

- Adversarial-robustness and failure analysis

## 12. Reference Architecture (illustrative)

One workable shape - not prescriptive.

Image (+ optional caption / metadata) → Pre-processing & Augmentation → CV Detector (CNN/ViT) → Calibrated

Verdict → Explainer (heat-map + grounded text) → Responsible UI (“likely AI-generated”)

## 13. Final Challenge Statement

SignalScope - Telling Real From Synthetic in the Age of Generative Media. Build a system that decides whether an image is real or AI-generated and reports its performance on a provided held-out test set that includes images from unseen generators (the core task), presented responsibly as a likelihood rather than an accusation. Optionally extend it with a faithful, human-readable explanation of the visual cues behind each verdict, generator attribution, robustness to degradation, provenance/metadata signals, multimodal image–text consistency, or a deployable interface. Submissions are judged on a shared, objective core metric - weighted toward generalisation to unseen generators - plus the faithfulness, reproducibility, and trust-impact of what you build, creating a practical tool for media authenticity at internet scale.
