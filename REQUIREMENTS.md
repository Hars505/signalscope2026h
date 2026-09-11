# Requirements — SignalScope

> Tags: **[REQ]** stated in the problem statement · **[ASSUMPTION]** not stated, default chosen · **[RECOMMEND]** engineering choice · **[BONUS]** tied to modules A–G.

## 1. Functional Requirements

| ID | Description | Actor | Preconditions | Inputs | Processing | Outputs | Errors | Priority | Dependencies |
|---|---|---|---|---|---|---|---|---|---|
| FR-1 | Upload & classify an image | Guest/User | None | Image file (jpg/png) | Preprocess → classifier → calibrate | Label + confidence | Unsupported format, oversized file, corrupt image | **P0** [REQ] | Trained model |
| FR-2 | Report held-out metrics | Team/Organizer | Held-out access | Predict interface + labels | ROC-AUC, macro-F1, confusion matrix, FPR | One-page metrics report | Metric mismatch on reproduction | **P0** [REQ] | FR-1, standalone predict script |
| FR-3 | Standalone predict interface (CLI) | Judge | Repo cloned, env installed | Image path | Load model, run inference | JSON/stdout: label, confidence | Missing weights, env mismatch | **P0** [REQ §7.1] | Model artefact |
| FR-4 | Generate explanation + heat-map | User | FR-1 complete | Image + activations | Grad-CAM + grounded text | Heat-map + cue list | No salient region, low confidence | P1 [BONUS-A] | FR-1 |
| FR-5 | User signup/login | Visitor | — | Email/username + password | Django auth | Session/JWT | Duplicate email, weak password | P1 [ASSUMPTION] | Django + DRF |
| FR-6 | Persist & list scan history (sidebar) | User | Logged in | User ID | Query Scan table | List: thumbnails, verdicts, dates | Empty history | P1 [ASSUMPTION, your stack] | FR-5 |
| FR-7 | Re-open a past scan from sidebar | User | History exists | Scan ID | Fetch scan + explanation/heatmap | Full result view | Scan not found/deleted | P2 | FR-6 |
| FR-8 | Admin: list/deactivate/delete users, view totals | Admin | Admin login | — | Django Admin queries | User table, counts | Permission denied | P1 [ASSUMPTION, your stack] | Django auth |
| FR-9 | Generator attribution | User | FR-1 complete | Image | Multi-class head | Family label + metric | Ambiguous attribution | P2 [BONUS-B] | Auxiliary model |
| FR-10 | Robustness self-test on upload | System | FR-1 complete | Image | Re-run on recompressed/resized copy | Stability note | — | P2 [BONUS-C] | FR-1 |
| FR-11 | Metadata/provenance check | System | EXIF/C2PA present | Image bytes | Parse EXIF/C2PA | Provenance note | No metadata | P3 [BONUS-D] | Library support |
| FR-12 | Caption-consistency check | User | Caption provided | Image + text | Vision-language scoring | Match/mismatch signal | Empty caption | P3 [BONUS-E] | Multimodal model |

## 2. AI/ML Requirements

- **Problem definition** [REQ]: binary classification (real vs. AI-generated); optional multi-class generator-family attribution [BONUS-B].
- **Input**: a single RGB image, arbitrary resolution.
- **Output**: label + calibrated confidence [REQ]; optionally heat-map + text [BONUS-A]; optionally generator family [BONUS-B].
- **Model candidates** [RECOMMEND]: ResNet-50 / EfficientNet-B0-B3 first (cheap, strong on texture artefacts); ViT-Small or CLIP-ViT as a stretch comparison.
- **Baseline** [REQ, §7.3]: compare against the organizers' published baseline if one exists at kickoff; otherwise an ImageNet-pretrained ResNet-50 with no augmentation is your internal baseline.
- **Transfer learning** [REQ, "encouraged"]: fine-tune an ImageNet-pretrained backbone.
- **CNN vs. ViT evaluation** [REQ, suggested]: justify backbone choice in the model report at minimum; a head-to-head comparison is a P2 stretch.
- **Frequency-domain / artefact features** [REQ suggests, §6/§11]: FFT/DCT-based branch — highest-leverage differentiator for generalization if time allows after the core model works.
- **Data augmentation** [RECOMMEND]: JPEG recompression, resize/rescale, mild blur, colour jitter — doubles as Bonus-C training data.
- **Training strategy** [RECOMMEND]: train on the provided set (+ cited public data, e.g. GenImage); hold out entire generator sub-classes for validation where possible rather than a pure random split.
- **Validation strategy** [REQ-driven]: simulate the unseen-generator condition internally (validate on a generator family excluded from training) since the real held-out set can never be touched.
- **Data leakage prevention** [REQ, non-negotiable]: held-out set never touches training/validation in any form; document the exact split.
- **Generator-level generalisation** [REQ, first-class requirement]: the primary optimization target, not training-distribution accuracy.
- **Confidence calibration** [REQ, implied by §5 "AUC-calibrated" example + §11]: temperature or Platt scaling on a held-out validation split.
- **Threshold selection** [REQ, §4.2]: pick and state one operating threshold; favor lower FPR (false "fake" on a real photo is called out as the costlier error).
- **Model versioning** [RECOMMEND]: semantic version + commit hash per checkpoint; keep only final weights in repo/release.
- **Experiment tracking** [RECOMMEND, lightweight]: a CSV/JSON run log is sufficient — a full MLflow/W&B setup is over-engineering for this timeline.

## 3. Dataset Requirements

| Aspect | Detail |
|---|---|
| Provided datasets | Train/val: CIFAKE-style real + synthetic set incl. disclosed generators such as Stable Diffusion, MIT/open-licensed, released at kickoff [REQ] |
| Dataset sources | Provided set + any cited public synthetic-image dataset added to training (e.g. GenImage) [REQ, must cite] |
| Licences | Provided set: MIT/open [REQ]; verify and cite any added dataset's licence |
| Size | ~100k+ labelled images, balanced real/fake [REQ] |
| Class distribution | Balanced in the provided set [REQ] |
| Image formats | [ASSUMPTION] standard JPEG/PNG |
| Image resolutions | [ASSUMPTION] confirm at kickoff — do not hard-code an input size; the brief's own example image is 512×512 [REQ, §5] |
| Training/validation data | Provided set (+ optional cited public data) [REQ] |
| Held-out test data | Organizer-controlled, unseen real photos + unseen-generator synthetics; evaluated only via your predict interface [REQ] |
| Unseen-generator split | The key differentiator, highest-weighted metric; a small public sample shared at kickoff for format checks only [REQ] |
| Data leakage risk | Training on the held-out set is "non-compliant," forfeits the entire AI/ML axis [REQ, hard rule] |

## 4. Evaluation Strategy

**Mandatory metrics [REQ]**: ROC-AUC (overall + unseen-generator split), macro-F1, accuracy, FPR at a stated threshold, confusion matrix.

**Protocol [REQ]**: report overall and unseen-split performance separately, never blended; report at one fixed, stated threshold; compare to the organizers' baseline or an honestly-reported internal one.

**[RECOMMEND] if Module C pursued**: report the same metrics after JPEG recompression/resize/screenshot simulation as a degradation-vs-accuracy curve.

## 5. Explainability & Trust Requirements [BONUS-A rubric, REQ §4.3, verbatim]

| Dimension | What earns points |
|---|---|
| Correctness | Cited cues correspond to real artefacts, verified against provided ground-truth annotations |
| Localisation | Heat-map highlights the genuinely anomalous region, not the whole image |
| Usefulness | A non-expert can understand and act on it; uncertainty communicated honestly |
| No over-claiming | No fabricated certainty; never asserts anything about real individuals/events |

## 6. Robustness & Generalisation Requirements

- Unseen generators — [REQ] primary axis.
- JPEG compression / resizing / screenshots / light editing — [REQ, §3.2-C] real-world conditions detectors usually break on.
- Failure analysis — [REQ, §7.3 "Limitations" field] mandatory in the model report regardless of whether Module C is attempted.

## 7. Non-Functional Requirements

| Aspect | Requirement |
|---|---|
| Performance | [ASSUMPTION] ~2–3s CPU inference acceptable; sub-second on GPU |
| Security | [RECOMMEND] standard web hygiene only — see security section below; no over-building |
| Scalability | [ASSUMPTION] a handful of concurrent demo users, not internet scale |
| Reliability | [RECOMMEND] graceful errors on bad uploads, never crash on malformed input |
| Accessibility | [REQ, §9 UX axis] alt text, sufficient contrast, keyboard-navigable upload |
| Maintainability | [RECOMMEND] modular monolith, clear folder boundaries |
| Reproducibility | [REQ, hard gate] judge reproduces a prediction in <~10 minutes from a clean clone |
| Resource efficiency | [ASSUMPTION] must run on a single free-tier GPU/Colab or modest CPU |
| Compliance | [REQ] no PII beyond basic auth; never process images of identifiable people as a target |

## 8. Security Requirements (OWASP-aligned, scoped to hackathon reality)

| Control | Applies? | Notes |
|---|---|---|
| Password hashing | Yes | Django's default PBKDF2 — never roll your own |
| RBAC | Minimal | `is_staff`/`is_superuser` distinguishes Admin from User |
| JWT | Optional | SimpleJWT if the SPA needs stateless cross-origin auth; Django session auth also fine |
| CORS | Yes | `django-cors-headers`, restricted to the known frontend origin |
| Input validation | Yes | File-type/size checks before an image reaches the model |
| File upload security | Yes | Restrict MIME types, cap size, re-encode via Pillow rather than storing the raw upload verbatim |
| Rate limiting | [RECOMMEND, light] | DRF throttling on `/api/scan` |
| Secrets management | Yes | `.env`, excluded via `.gitignore` — important since the repo is public [REQ §7] |
| HTTPS / MFA / audit logs | Not required | Out of scope for a 4-day hackathon |

## 9. Responsible AI & Ethics [all REQ — mandatory, disqualifying if violated]

- Allowed: detecting synthetic scenes/objects/art/product shots.
- Prohibited: face-swap deepfake detection of real people; political/real-world-event claim adjudication; identifying, profiling, or making claims about specific real individuals.
- No sourcing or processing of images of identifiable individuals, in the provided data or any added public data.
- Module E captions must be generic, never political claims about real events.
- False "AI-generated" on a real photo is the explicitly costlier error — reflect this in threshold choice.
- Always show confidence, never a bare label; low-confidence results must say so plainly.
- UI copy: "likely AI-generated" / "likely real," never "this is fake" or "this is fraud."
- [RECOMMEND] frame the tool as decision support for journalists/platforms, not an automated takedown trigger.

## 10. User Roles & Permissions [ASSUMPTION/RECOMMEND — not specified by the brief]

| Role | Permissions |
|---|---|
| Guest | Run one scan, see result immediately, no persisted history |
| Registered User | Everything Guest can + persisted scan history in sidebar, re-open past scans |
| Admin | Django-admin: list/search users, view total user count, activate/deactivate/delete accounts, view aggregate scan counts |

Only these three roles are actually required — no moderator/reviewer tier, no team/org accounts.
