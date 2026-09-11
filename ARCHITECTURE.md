# Architecture — SignalScope

> Tags: **[REQ]** stated in the problem statement · **[ASSUMPTION]** not stated, default chosen · **[RECOMMEND]** engineering choice · **[BONUS]** tied to modules A–G.

## 1. Architecture Style

**Modular monolith** [RECOMMEND] — one Django project with clearly separated apps, one React app, one database. **Not microservices**: there is no scale or team-size justification for splitting services in a 4-day hackathon, and it only increases the risk of missing the reproducibility gate [REQ, §9 — an unreproducible core caps the entire score].

## 2. Reference Architecture [REQ, §12, verbatim shape]

```
Image (+ optional caption/metadata)
   → Pre-processing & Augmentation
   → CV Detector (CNN/ViT)
   → Calibrated Verdict
   → Explainer (heat-map + grounded text)
   → Responsible UI ("likely AI-generated")
```

## 3. Concrete System Diagram [RECOMMEND]

```
┌─────────────────────┐        ┌──────────────────────────────────────┐        ┌─────────────────┐
│   React SPA (Vite)  │  REST  │        Django + DRF backend           │        │  SQLite/Postgres │
│  ─────────────────  │◄──────►│  ────────────────────────────────    │◄──────►│  ─────────────── │
│  Upload/Result view │  JSON  │  accounts app (auth)                  │        │  User            │
│  History sidebar    │        │  scans app (Scan model, endpoints)    │        │  Scan            │
│  Login/Signup       │        │  ml app (wraps ml/predict.py)         │        │  DegradationTest │
└─────────────────────┘        │         │                             │        └─────────────────┘
                                │         ▼                             │
                                │  ml/predict.py  ◄── also used by ──┐ │
                                │  (loads model once, in-process)     │ │
                                └──────────────────────────────────┼─┘
                                                                     │
                                                     ┌───────────────▼───────────────┐
                                                     │  Standalone CLI: predict.py    │
                                                     │  (what the judge runs, [REQ])  │
                                                     └────────────────────────────────┘
```

The key design rule: **`ml/predict.py` is the single shared inference entrypoint**, imported by both the Django view and the standalone CLI script judges run directly [REQ §7.1/§4.1]. This guarantees the web app's verdict and the judged verdict can never drift apart, and it means the ML pipeline is never accidentally coupled to the Django server being up.

## 4. Technology Stack

| Layer | Choice | Why | Alternatives considered | Trade-off |
|---|---|---|---|---|
| ML framework | **PyTorch** [RECOMMEND] | Best transfer-learning ecosystem (`timm`), easiest Grad-CAM tooling | TensorFlow/Keras | Comparable model zoo, less common in the CV research code you'll adapt |
| Model architecture | ResNet-50/EfficientNet → optional CLIP-ViT | Fast to fine-tune in days; strong on texture/frequency artefacts | ViT-only, custom CNN | ViT needs more data/compute than this timeline affords |
| CV utilities | OpenCV, Pillow, `timm`, `torchvision` | Standard, documented | — | — |
| Explainability | `pytorch-grad-cam` | Purpose-built, minimal integration | Captum | Heavier than needed |
| Backend | **Django + DRF** [your stated preference] | Batteries-included auth, ORM, and a **free admin panel** that directly satisfies "manage users / see totals" | FastAPI, Flask | FastAPI is faster for pure ML-serving but you'd hand-build auth + admin |
| Frontend | **React (Vite)** [your stated preference] | Fast dev server, component model suits a chat-like sidebar + upload/result view | Next.js | Next.js adds SSR/routing you don't need for a single-page tool |
| Database | **SQLite (dev/demo), Postgres if deployed** [RECOMMEND] | Zero-setup for a judge's clean clone (10-minute gate) | MySQL, Postgres-only | Postgres-only raises setup friction for the judge |
| Cache | None [RECOMMEND] | No need at hackathon scale | Redis | Pure over-engineering |
| Auth | Django's built-in auth / SimpleJWT if SPA needs stateless tokens | Native, minimal code | Auth0/Firebase | External dependency, signup friction for a local judge run |
| Storage | Local filesystem (`MEDIA_ROOT`) | Zero external dependency for reproducibility | S3/Cloudinary | Adds credentials the judge doesn't have |
| Hosting | [ASSUMPTION, optional] Render/Railway (backend) + Vercel/Netlify (frontend) | Zero-cost, fast to stand up | Self-managed VM | Ops overhead you don't have time for |
| Containerisation | [RECOMMEND] one optional `Dockerfile`, not Compose | Slight reproducibility boost | Docker Compose | Extra setup steps can hurt the 10-minute repro gate |
| Monitoring/Logging | Python `logging` to stdout/file | Sufficient | Sentry/ELK | Unnecessary infra for this scale |

## 5. Data Flow

1. **Training (offline, outside the web app)**: dataset scripts → augmentation → train/val split → model training → calibration → export weights to `/model/weights/`.
2. **Inference (both paths call the same function)**:
   - CLI: `python model/predict.py --image path.jpg` → loads `ml/predict.py::predict()` → prints JSON.
   - Web: React uploads to `POST /api/scan` → Django view calls the same `predict()` → persists a `Scan` row → returns JSON to React.
3. **Judging**: organizers run the CLI predict interface directly against their held-out set — this path never touches the Django server or the database [REQ, §4.2/§7.1].

## 6. Database Schema

A database is required to persist user accounts and per-user scan history, and to back the admin panel — driven by your stated product requirement, not the brief itself.

| Table | Purpose | Key fields |
|---|---|---|
| `User` (Django built-in) | Auth | id, username/email, password hash, is_staff, date_joined |
| `Scan` | One row per prediction (the "chat history" unit) | id, user_id (FK, nullable for guest), image (file ref), label, confidence, verdict_threshold, generator_attribution (nullable), explanation_text, heatmap_image, created_at |
| `DegradationTest` [only if Module C built] | Robustness self-test results per scan | id, scan_id (FK), transform_type, confidence_after |

Relationships: `User 1—* Scan`; `Scan 1—* DegradationTest` (optional). Index `Scan.user_id` and `Scan.created_at` for the sidebar's "most recent first" query — nothing more elaborate is needed at this scale.

## 7. Repository Structure [REQ, §7.1 — exact structure required for submission]

```
/README.md              ← entry point, see submission requirements
/app (or /src)           ← Django project + React app
  /backend
    /accounts            ← Django app: auth
    /scans                ← Django app: Scan model, DRF endpoints
    /ml                   ← Django app: thin wrapper calling ml/predict.py
    manage.py
    requirements.txt
  /frontend
    /src
    package.json
/model                    ← training + inference code + predict interface
  train.py
  predict.py               ← the standalone CLI judges run
  gradcam.py
  calibration.py
  weights/ (or a release link if large)
/report                   ← one-page model report + explanation samples (if Module A)
requirements.txt / environment file
```

## 8. Deployment Strategy

- **Cloud provider** [ASSUMPTION, optional]: Render/Railway (backend + Postgres), Vercel/Netlify (React build) — free tiers.
- **Docker**: optional single backend Dockerfile; skip Compose/multi-container setups.
- **CI/CD** [RECOMMEND, only if time remains]: a minimal GitHub Action running `pip install -r requirements.txt` + a smoke test of `predict.py` on a sample image — doubles as proof of reproducibility.
- **Model serving**: in-process inside the Django process — no separate serving infra.
- **GPU/CPU**: train on whatever free GPU is available (Colab/Kaggle); serve on CPU.
- **Backups/rollback**: not needed at this scale; `git revert` is sufficient.

## 9. Reproducibility Requirements [REQ, hard scoring gate §9]

- Repo structure matches §7 above exactly.
- `requirements.txt` pins exact versions; note the Python version.
- Model weights published via a GitHub Release asset if large, linked from the README.
- A single `config.py`/`.env.example` lists every tunable (threshold, model path).
- Random seeds fixed and stated for the split and model init.
- A judge must go from clean clone to first prediction in **under ~10 minutes** — time this yourself before submitting.

## 10. What Not to Build [derived from global instruction: do not over-engineer]

Microservices, a message queue, Redis/caching, Docker Compose multi-container setups, cloud object storage, a hand-rolled admin panel (Django gives you one free), a separate model-serving microservice.
