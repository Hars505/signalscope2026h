# PRD — SignalScope

**Telling Real From Synthetic in the Age of Generative Media**
SIH-2026 Internal Hackathon [C-433], L. J. Institute of Engineering and Technology

> Tags used throughout this doc set: **[REQ]** = stated in the problem statement PDF (non-negotiable) · **[ASSUMPTION]** = not stated, a reasonable default · **[RECOMMEND]** = an engineering/product choice on top of the requirements · **[BONUS]** = tied to one of the optional modules A–G.

---

## 1. Overview

| Field | Value |
|---|---|
| Project name | **SignalScope** [REQ] |
| Tagline | "Telling Real From Synthetic in the Age of Generative Media" [REQ] |
| Category | AI / Media Forensics / Trust & Safety [REQ] |
| Technology | Computer Vision · Multimodal ML · GenAI (explanations) [REQ] |
| Target users | Journalists, platforms, fact-checkers, everyday users [REQ] |
| Difficulty | Advanced (above-average) [REQ] |
| Submission window | 10–15 September 2026 [REQ] |

## 2. Vision

A tool that looks at a single image and tells a non-expert, in plain language and with an honest confidence level, whether it's real or AI-generated — and, critically, keeps working when the image comes from a generator the model has never seen. Presented always as a likelihood ("likely AI-generated"), never an accusation [REQ, §1].

## 3. Problem

Text-to-image generators now produce photorealistic images in seconds, fueling misinformation, fraud, fake product listings, and manipulated "evidence" [REQ, §1]. Detectors that perform well on generators they were trained on routinely fail on new ones — which is exactly the situation that matters in the real world, since new generators appear constantly [REQ, §1]. The organizers deliberately built the held-out judging set to include generators absent from training data, specifically so that memorized, dataset-tuned solutions don't win [REQ, §4.1].

**Root cause** [ASSUMPTION]: detectors typically learn generator-specific artefacts rather than generator-agnostic "synthetic-ness," so they overfit to the training distribution of generators.

## 4. Scope & Ethics Boundary [REQ, §1 — disqualifying if violated]

In scope: detecting AI-generated/synthetic imagery in general — scenes, objects, art, product shots.

**Explicitly out of scope, no exceptions:**
- Face-swap deepfakes of real, identifiable people.
- Any feature that identifies, profiles, or makes claims about specific real people.
- Sourcing your own images of identifiable individuals.
- Political-claim or real-world-event adjudication.
- Presenting a verdict as a certainty/accusation rather than a likelihood.

## 5. Target Users & Personas

| User | Need [REQ/ASSUMPTION] |
|---|---|
| Journalist / fact-checker | A fast, defensible verdict with a cue-level explanation they can cite to an editor |
| Platform / marketplace trust & safety | A likelihood signal to triage suspicious listings, not an auto-takedown trigger |
| Everyday user | A plain-language answer to "is this photo real?" with no technical jargon |

**Personas** [ASSUMPTION]:
- *Priya, marketplace shopper* — pastes a product photo, wants "likely real / likely fake" and why, in seconds.
- *Rahul, junior fact-checker* — needs the heat-map and cue list to justify a decision to an editor, and wants to know when the model itself is unsure.

## 6. Proposed Solution

Three layers, in strict priority order:

1. **Model layer [P0, REQ]** — transfer-learning binary classifier (real vs. AI-generated), calibrated confidence, evaluated honestly on a held-out set that includes unseen generators.
2. **Trust layer [P1, BONUS-A headline]** — Grad-CAM-style heatmap + grounded, non-fluent-but-honest explanation of the cues, scored on faithfulness not eloquence.
3. **Product layer [P1, BONUS-F, your stated stack]** — a React + Django web app: upload/verdict UI, per-user scan history in a sidebar, and a Django-admin console for user management. This layer is *not* requested by the brief — it is your own product ambition, deliberately sequenced after the two layers above because the brief states a submission without the core is "incomplete regardless of how many bonus modules it includes" [REQ, §3.1].

## 7. Goals & Non-Goals

**Goals**
- Beat a naive baseline on unseen-generator ROC-AUC, the brief's primary ranking metric [REQ, §4.2].
- Ship a faithful explanation, not a fluent-sounding guess [REQ, §4.3].
- Ship a usable, responsibly-worded web app around it [ASSUMPTION-driven, your stack].
- Be reproducible by a judge from a clean clone in under ~10 minutes [REQ, §7/§22].

**Non-goals**
- Production-scale infrastructure (queues, caching, multi-service architecture) — explicitly over-engineering for this brief.
- Any of Modules B/D/E/G unless A and F are fully done with days to spare.
- Anything touching identifiable real people, under any framing.

## 8. Success Metrics

**ML metrics [REQ]**: overall ROC-AUC, unseen-generator ROC-AUC (primary), macro-F1, accuracy, FPR at a stated threshold, confusion matrix, calibration quality.

**Product metrics [ASSUMPTION]**: a first-time user completes upload → verdict with no instructions; median scan latency under ~3s; % of uploads returning a verdict without error.

**Competition metrics** — official judging weights [REQ, §9]:

| Criterion | Weight |
|---|---:|
| AI/ML Implementation | 25 |
| Technical Implementation (reproducibility-gated) | 20 |
| Innovation & Creativity | 15 |
| Explanation & Trust Impact | 15 |
| User Experience | 10 |
| Problem Understanding | 10 |
| Presentation & Demo | 5 |
| **Total** | **100** |

**Tie-break order [REQ, §10]**: (1) unseen-generator-split AUC, (2) overall held-out AUC, (3) reproducibility, (4) explanation faithfulness then depth of other bonus modules.

## 9. Scope Summary

| | Included | Priority |
|---|---|---|
| Core classification + honest metrics + standalone predict interface | Yes | **P0 — mandatory** [REQ] |
| Module A — Faithful Explanation (Grad-CAM + grounded text) | Yes | P1 [BONUS] |
| Module F — Deployable web app (React + Django, history, admin) | Yes | P1 [BONUS, your stack] |
| Module B — Generator attribution | Only if time remains | P2 [BONUS] |
| Module C — Robustness to degradation | Only if time remains | P2 [BONUS] |
| Module D — Provenance/metadata | Unlikely | P3 [BONUS] |
| Module E — Multimodal image+text | Unlikely | P3 [BONUS] |
| Module G — Active defence analysis | As a short write-up only, if at all | P3 [BONUS] |

See `DEVELOPMENT_PLAN.md` for the day-by-day sequencing and the hard Day-3 cutover rule, and `REQUIREMENTS.md` for the full functional/AI/dataset requirement detail behind this scope.

## 10. Open Questions [carried through to DEVELOPMENT_PLAN.md]

1. Exact kickoff dataset format/location and whether a numeric baseline is published.
2. Actual image resolution(s) in the provided dataset (the brief's own example is 512×512; CIFAKE-style sets are historically much smaller — confirm before writing preprocessing code).
3. Team size and available compute.
4. Whether a live demo is expected for this team or only the recorded video.
5. Whether guest (no-login) scanning should exist alongside accounts.
