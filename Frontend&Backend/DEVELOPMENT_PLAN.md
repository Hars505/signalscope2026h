# Development Plan — SignalScope

> Tags: **[REQ]** stated in the problem statement · **[ASSUMPTION]** not stated, default chosen · **[RECOMMEND]** planning choice · **[BONUS]** tied to modules A–G.

## 1. Hackathon Constraints [all REQ, §8]

- All substantive work must be **committed between 10–15 September 2026**. Commit history must reflect real, dated development inside the window — pre-built repos are disqualified.
- Open-source libraries, pretrained backbones, and public datasets are allowed and encouraged, with citation.
- Copying a public real-vs-fake notebook wholesale is prohibited — an **originality declaration** listing any third-party code/notebooks referenced is mandatory.
- AI coding assistants are explicitly allowed — the working system and its evaluation are what get scored.
- Respect the scope & ethics rules at all times (no real individuals, no political-claim adjudication).

## 2. Timeline

*(Assumes "today" is 11 September — adjust dates if this plan is used later; keep the day-count logic.)*

| Day | Phase | Key work |
|---|---|---|
| Day 1 | Planning + Baseline | Finalize scope (this doc set), set up the repo skeleton exactly per `ARCHITECTURE.md` §7, load the provided dataset, train a first ResNet-50 baseline with **no** augmentation — get a number on the board today |
| Day 2 | Model development | Add augmentation (incl. JPEG/resize — dual-purpose for Module C later), tune backbone/hyperparameters, implement calibration, start Grad-CAM integration |
| Day 3 | Explainability + minimal interface | Finish Grad-CAM + templated explanation text (Module A); build the standalone CLI predict script and a minimal Django endpoint wrapping it. **Core + headline bonus should be demoable by end of Day 3.** |
| Day 4 | Product layer + hardening | React upload/result UI + history sidebar + Django admin customization (Module F); write the one-page model report and README; run robustness eval (Module C) only if ahead of schedule |
| Day 5 (if available) | Freeze, record, submit | Time the clean-clone setup (must be <10 min), record the 3–5 min demo video, write the originality declaration, final commit, submit |

**Hard rule [RECOMMEND, derived from REQ §3.1]:** if by end of Day 3 the core classifier + predict interface + basic metrics aren't working, **drop all bonus/product-layer work** and finish the core. The brief states verbatim: "a submission that does not deliver the core task is considered incomplete regardless of how many bonus modules it includes."

## 3. Team Roles [RECOMMEND — brief does not specify a team structure]

| Role | Responsibilities | Allocation |
|---|---|---|
| ML Engineer | Data pipeline, model training, calibration, metrics/report | ~40% — highest priority, gates everything else |
| CV/Explainability Engineer | Grad-CAM integration, cue-text generation, faithfulness checks | ~20% |
| Backend Engineer (Django) | Auth, Scan model, DRF endpoints, admin customization, wiring to `ml/predict.py` | ~15% |
| Frontend Engineer (React) | Upload UI, result view, history sidebar, responsible-language copy | ~15% |
| MLOps/Deployment | Repo structure, requirements, README, demo video, optional deploy | ~5%, but continuous |
| Product/Research Lead | Keeps scope honest against this doc set, writes the model report + originality declaration | Ongoing |

If solo or two-person: collapse into "ML first, product wrapper second," strictly timeboxed per the table above.

## 4. Implementation Prioritization

| Feature | Score impact | Effort | Risk | Class |
|---|---|---|---|---|
| Trained classifier + honest split + held-out metrics | Very High | Medium | Medium | **P0** |
| Standalone predict CLI/script | Very High (reproducibility gate) | Low | Low | **P0** |
| ROC-AUC / macro-F1 / confusion matrix / FPR@threshold reporting | High | Low | Low | **P0** |
| README + one-page model report + originality declaration | High | Low | Low | **P0** |
| Calibration (temperature/Platt scaling) | Medium-High | Low | Low | **P0** |
| Grad-CAM + grounded explanation text (Module A) | High | Medium | Medium | **P1** |
| Minimal web interface (upload → verdict) | Medium | Low-Medium | Low | **P1** |
| React history sidebar + Django admin (Module F) | Medium | Medium | Low | **P1** |
| Frequency-domain feature branch | Medium | Medium-High | Medium | P2 |
| Robustness/degradation evaluation (Module C) | Medium | Low (reuses augmentation) | Low | P2 |
| Generator attribution (Module B) | Low-Medium | Medium-High | Medium | P2 |
| Provenance/metadata (Module D) | Low | Medium-High | High (tooling immaturity) | P3 |
| Multimodal caption consistency (Module E) | Low | Medium | Medium | P3 |
| Active defence study (Module G) | Low-Medium | Low if a short write-up | Low | P3 |
| Docker/CI, cloud deployment | Not directly scored | Medium | Low | P3 |

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Unseen-generator failure | High (the deliberately hard part of the brief) | Very high (primary metric + tie-break #1) | Frequency/artefact features, aggressive augmentation, honest reporting of failure modes |
| Dataset leakage into held-out set | Low if disciplined, catastrophic if not | Disqualifying | Never touch the organizers' held-out set or "small public sample" for training |
| Overfitting to training generators | High without mitigation | High | Validate on excluded generator families |
| Poor calibration | Medium | Medium | Temperature/Platt scaling, honest low-confidence messaging |
| False positives (real flagged as fake) | Medium | High — explicitly the costlier error | Threshold tuned toward lower FPR |
| Explanation hallucination | Medium if using free-running LLM text | High (own 15-pt axis) | Ground all explanation text strictly in Grad-CAM output regions |
| Reproducibility failure | Medium — easy to underestimate | Very high (scoring gate) | Time the clean-clone setup yourself before submitting |
| **Deadline risk** | **High — very few days remain** | **Very high** | **Strict adherence to the timeline and the Day-3 cutover rule** |
| **Scope creep into full-stack product features at the expense of the core model** | **High, given the React/Django/history/admin ambitions** | **Very high** | **P0 core is non-negotiable before any P1 product work begins** |

## 6. Decisions

**Confirmed** (from your stated stack)
- Frontend: React. Backend: Python/Django. A database is required for per-user scan history and admin user management.

**Recommended, pending sign-off**
- SQLite for local/dev, Postgres only if deployed.
- Django's built-in admin (customized), not a hand-built admin UI.
- In-process model serving inside Django, not a separate ML microservice.
- PyTorch + ResNet-50/EfficientNet first, ViT only as a stretch comparison.

**Requires experimentation**
- Final backbone choice — decide after Day 1/2 baseline numbers.
- Calibration method — pick whichever validates better.
- Operating threshold — set only after seeing the real FPR/TPR trade-off on your validation split.

**Deferred**
- Whether to deploy publicly at all.
- Which bonus modules beyond A and F to attempt — decide at the Day-3 checkpoint.

## 7. Open Questions

1. Exact kickoff dataset format/location; is a numeric baseline published?
2. Actual training image resolution(s) — confirm before writing preprocessing code.
3. Team size and available compute.
4. Is a live demo expected, or only the recorded video?
5. Should guest (no-login) scanning exist alongside accounts?
6. Should users be able to delete their own scan history?

## 8. Submission Checklist [REQ, §7/§8]

- [ ] Repo structure matches the required layout exactly.
- [ ] README covers all 6 required items (modules built, setup/run <10 min, datasets + licences, metrics, architecture/limitations, demo link).
- [ ] One-page model report in `/report` with all 6 required fields.
- [ ] Explanation samples included in `/report` if Module A attempted.
- [ ] `requirements.txt`/environment file present and pinned.
- [ ] Originality declaration written.
- [ ] Commit history spans the actual working window with real, dated commits.
- [ ] Clean-clone setup timed and confirmed under ~10 minutes.
- [ ] 3–5 minute demo video recorded, showing core + any bonus modules.
- [ ] No feature or output touches identifiable real people or political claims.
