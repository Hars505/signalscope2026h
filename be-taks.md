# Backend Task Plan — SignalScope

> 2 members, backend only. No ML model work, no frontend. Starting from zero.
> ML team builds `model/predict.py`. Frontend team builds React app. Backend connects both.

---

## Team Split

| Member | Role | Owns |
|---|---|---|
| **B1** | Core API | Django scaffold, Scan model, scan/history endpoints, ML integration wrapper, media config |
| **B2** | Auth + Admin + Infra | Auth system, admin panel, CORS/security, file validation, requirements, .env, deployment config |

---

## Integration Contracts (what backend gives/receives)

### Backend receives FROM ML team

ML team delivers `/model/predict.py` with this function:

```
predict(image: PIL.Image, caption: str | None = None) -> dict
  Returns: {
    "label": "real" | "ai_generated",
    "confidence": float (0-1),
    "heatmap": PIL.Image | None,
    "explanation": list[str] | None,
    "generator_attribution": str | None
  }
```

**Until ML team delivers this**, B1 creates a mock/stub that returns dummy data so backend can be tested independently.

### Backend provides TO frontend team

```
POST /api/scan          — upload image, get verdict
GET  /api/history       — user's past scans
GET  /api/history/<id>  — single scan detail
POST /api/auth/signup   — create account
POST /api/auth/login    — get JWT token
POST /api/auth/logout   — invalidate token
```

Response shapes documented in endpoint tasks below.

---

## Phase 1 — Scaffold (B1 + B2 together, ~1 hour)

> [!IMPORTANT]
> Do Phase 1 together on one screen. Sets up shared structure both members build on.

### Task 1.1 — Django project init (B1 leads, B2 watches)

- [ ] Create Django project: `django-admin startproject config .` inside `/app/backend/`
- [ ] Create three apps: `accounts`, `scans`, `ml`
- [ ] Register all three apps in `INSTALLED_APPS`
- [ ] Set up folder structure matching:

```
/app/backend/
  manage.py
  /config/         — settings.py, urls.py, wsgi.py, asgi.py
  /accounts/       — B2 owns this
  /scans/          — B1 owns this
  /ml/             — B1 owns this (thin wrapper)
```

### Task 1.2 — Base settings (B2 leads, B1 watches)

- [ ] Create `.env.example` with: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL` (optional)
- [ ] Install and configure `django-environ` or `python-decouple` for env loading
- [ ] Set `MEDIA_ROOT = BASE_DIR / "media"` and `MEDIA_URL = "/media/"`
- [ ] Set database to SQLite (default, zero setup for judges)
- [ ] Add media URL serving in `config/urls.py` for dev mode

### Task 1.3 — Git + requirements (B2)

- [ ] Create `/app/backend/requirements.txt` with initial deps:
  - Django, djangorestframework, django-cors-headers, djangorestframework-simplejwt, Pillow, python-decouple (or django-environ)
- [ ] Update `.gitignore`: add `env/`, `*.pyc`, `__pycache__/`, `db.sqlite3`, `.env`, `media/`
- [ ] Both members: `pip install -r requirements.txt`, confirm `manage.py runserver` works
- [ ] Commit: "feat: django project scaffold"

---

## Phase 2 — Parallel Work (B1 and B2 work independently)

---

### B1 Tasks — Core API

#### Task B1-1: Scan model (`scans/models.py`)

- [ ] Create `Scan` model with fields:
  - `user` — ForeignKey to User, null=True, blank=True (guest scans allowed)
  - `image` — ImageField, upload_to="scans/"
  - `label` — CharField, choices: "real", "ai_generated"
  - `confidence` — FloatField
  - `threshold_used` — FloatField
  - `generator_attribution` — CharField, null/blank (Module B)
  - `explanation_text` — JSONField, null/blank (list of cue strings, Module A)
  - `heatmap_image` — ImageField, upload_to="heatmaps/", null/blank (Module A)
  - `created_at` — DateTimeField, auto_now_add
- [ ] Add Meta index on `["user", "-created_at"]`
- [ ] `makemigrations` + `migrate`
- [ ] Commit: "feat: scan model with all verdict fields"

#### Task B1-2: DegradationTest model (optional, Module C)

- [ ] Create `DegradationTest` model:
  - `scan` — ForeignKey to Scan, related_name="degradation_tests"
  - `transform_type` — CharField (e.g. "jpeg_recompress", "resize", "screenshot")
  - `confidence_after` — FloatField
- [ ] Migrate
- [ ] Commit: "feat: degradation test model for module C"

> [!NOTE]
> Skip this if time tight. Can add later. Core scan model matters more.

#### Task B1-3: ML integration stub (`ml/` app)

- [ ] Create `ml/predict_wrapper.py` that:
  - Tries to import `predict` from `/model/predict.py` (ML team's file)
  - If import fails (ML not ready), falls back to a **mock function** returning dummy data:
    - label: "ai_generated", confidence: 0.85, heatmap: None, explanation: ["Mock: texture anomaly detected"], generator_attribution: "mock-diffusion"
  - Converts PIL heatmap image to saved file path (for storing in Scan.heatmap_image)
  - Handles errors gracefully (model loading failure, bad image)
- [ ] This wrapper is what the scan endpoint calls — never calls predict.py directly from views
- [ ] Commit: "feat: ml predict wrapper with mock fallback"

> [!IMPORTANT]
> The mock lets both backend members test the full API flow without waiting for ML team. Remove mock fallback before submission.

#### Task B1-4: Scan serializers (`scans/serializers.py`)

- [ ] `ScanCreateSerializer` — for POST /api/scan:
  - Accept fields: `image` (required), `caption` (optional string)
  - File validation: MIME type (image/jpeg, image/png only), max size (10MB)
- [ ] `ScanListSerializer` — for GET /api/history:
  - Return fields: `id`, `label`, `confidence`, `image` (thumbnail URL), `created_at`
- [ ] `ScanDetailSerializer` — for GET /api/history/<id>:
  - Return fields: `id`, `label`, `confidence`, `threshold_used`, `image`, `heatmap_url`, `explanation`, `generator_attribution`, `created_at`
  - Include nested `degradation_tests` if Module C model exists
- [ ] Commit: "feat: scan serializers for create/list/detail"

#### Task B1-5: Scan views (`scans/views.py`)

- [ ] `ScanCreateView` (POST /api/scan):
  - Accept multipart/form-data with image (+ optional caption)
  - Call `ml.predict_wrapper.run_prediction(image, caption)`
  - If user authenticated: save Scan row with user FK
  - If guest: still return result but don't persist (or persist with user=null — decide and document)
  - Return JSON response matching this shape:
    ```
    {
      "id": 42,
      "label": "ai_generated",
      "confidence": 0.88,
      "threshold_used": 0.5,
      "heatmap_url": "/media/heatmaps/42.png" or null,
      "explanation": ["Handle geometry inconsistent", "Reflections mismatch"] or null,
      "generator_attribution": "diffusion-family" or null,
      "created_at": "2026-09-13T10:15:00Z"
    }
    ```
  - Handle errors: bad file type, oversized file, model failure
- [ ] `ScanHistoryView` (GET /api/history):
  - Requires authentication
  - Return current user's scans, ordered by `-created_at`
  - Paginate (page size 20)
- [ ] `ScanDetailView` (GET /api/history/<id>):
  - Requires authentication + owner check (user can only see own scans)
  - Return full scan detail with heatmap URL, explanation, attribution
- [ ] Commit: "feat: scan create/history/detail views"

#### Task B1-6: Scan URLs (`scans/urls.py` + `config/urls.py`)

- [ ] Wire up:
  - `POST /api/scan/` → ScanCreateView
  - `GET /api/history/` → ScanHistoryView
  - `GET /api/history/<int:pk>/` → ScanDetailView
- [ ] Include scans URLs in config/urls.py under `/api/`
- [ ] Commit: "feat: scan url routing"

#### Task B1-7: Test scan endpoints

- [ ] Use Postman/curl to test:
  - POST /api/scan with a test image (should get mock prediction back)
  - POST /api/scan without auth (guest mode works)
  - POST /api/scan with auth (scan saved to DB)
  - GET /api/history (returns user's scans)
  - GET /api/history/<id> (returns detail)
  - GET /api/history/<id> for another user's scan (should 403/404)
  - POST with invalid file type (should reject)
  - POST with oversized file (should reject)
- [ ] Fix any issues found
- [ ] Commit: "fix: scan endpoint edge cases"

---

### B2 Tasks — Auth + Admin + Infra

#### Task B2-1: JWT auth setup

- [ ] Install and configure `djangorestframework-simplejwt` in settings:
  - Add to `INSTALLED_APPS` and DRF `DEFAULT_AUTHENTICATION_CLASSES`
  - Set token lifetimes (access: 1 hour, refresh: 1 day — reasonable for demo)
- [ ] Commit: "feat: simplejwt auth configuration"

#### Task B2-2: Auth serializers (`accounts/serializers.py`)

- [ ] `SignupSerializer`:
  - Fields: `email`, `username`, `password`, `password_confirm`
  - Validate: passwords match, email unique, username unique, password strength (use Django validators)
  - Create user on save
- [ ] `LoginSerializer`:
  - Fields: `email` (or `username`), `password`
  - Validate credentials, return user
- [ ] Commit: "feat: auth serializers"

#### Task B2-3: Auth views (`accounts/views.py`)

- [ ] `SignupView` (POST /api/auth/signup):
  - Accept email, username, password, password_confirm
  - Create user
  - Return user info + JWT tokens (auto-login after signup)
  - Response shape:
    ```
    {
      "user": { "id": 1, "username": "priya", "email": "priya@example.com" },
      "tokens": { "access": "...", "refresh": "..." }
    }
    ```
- [ ] `LoginView` (POST /api/auth/login):
  - Accept email/username + password
  - Return JWT tokens
  - Same response shape as signup
- [ ] `LogoutView` (POST /api/auth/logout):
  - Accept refresh token, blacklist it
  - Requires authentication
- [ ] `UserProfileView` (GET /api/auth/me) — optional but useful for frontend:
  - Returns current user info (id, username, email)
  - Requires authentication
- [ ] Commit: "feat: auth signup/login/logout views"

#### Task B2-4: Auth URLs (`accounts/urls.py` + `config/urls.py`)

- [ ] Wire up:
  - `POST /api/auth/signup/` → SignupView
  - `POST /api/auth/login/` → LoginView
  - `POST /api/auth/logout/` → LogoutView
  - `GET /api/auth/me/` → UserProfileView
  - `POST /api/auth/token/refresh/` → SimpleJWT TokenRefreshView
- [ ] Include accounts URLs in config/urls.py under `/api/auth/`
- [ ] Commit: "feat: auth url routing"

#### Task B2-5: CORS + security settings

- [ ] Configure `django-cors-headers`:
  - Add to `INSTALLED_APPS` and `MIDDLEWARE` (must be high in middleware order)
  - Set `CORS_ALLOWED_ORIGINS` = `["http://localhost:5173"]` (Vite dev server)
  - For production: add deployed frontend URL
- [ ] Set DRF default permission: `IsAuthenticatedOrReadOnly`
- [ ] Add DRF throttling on scan endpoint (optional, light): e.g. 30/hour for anon, 100/hour for auth
- [ ] Commit: "feat: cors and security configuration"

#### Task B2-6: File upload validation (shared utility)

- [ ] Create `scans/validators.py`:
  - `validate_image_file(file)`:
    - Check MIME type is in `["image/jpeg", "image/png"]`
    - Check file size under 10MB
    - Try opening with Pillow to verify it's a valid image (not just renamed)
    - Raise `ValidationError` with clear messages on failure
- [ ] B1 will import this in the scan serializer — coordinate
- [ ] Commit: "feat: image upload validators"

#### Task B2-7: Django admin customization (`scans/admin.py`)

- [ ] Register Scan model with custom admin:
  - `list_display`: id, user, label, confidence, created_at
  - `list_filter`: label, created_at
  - `search_fields`: user__username, user__email
  - `readonly_fields`: label, confidence, threshold_used, explanation_text
- [ ] Customize User admin:
  - Add `scan_count` method to `list_display`
  - Add `ScanInline` (TabularInline) to see user's scans on their detail page
- [ ] Create a superuser for testing: `python manage.py createsuperuser`
- [ ] Commit: "feat: django admin with scan counts and user management"

#### Task B2-8: Test auth endpoints

- [ ] Use Postman/curl to test:
  - POST /api/auth/signup with valid data (should create user + return tokens)
  - POST /api/auth/signup with duplicate email (should reject)
  - POST /api/auth/signup with weak password (should reject)
  - POST /api/auth/login with correct credentials (should return tokens)
  - POST /api/auth/login with wrong password (should 401)
  - GET /api/auth/me with valid token (should return user)
  - GET /api/auth/me without token (should 401)
  - POST /api/auth/logout with refresh token (should blacklist)
  - POST /api/auth/token/refresh with valid refresh (should return new access)
  - Django admin: login, see users, see scan counts
- [ ] Fix any issues found
- [ ] Commit: "fix: auth edge cases"

---

## Phase 3 — Integration (B1 + B2 together, ~1-2 hours)

#### Task 3.1: Wire validators into scan endpoint

- [ ] B1 imports B2's `validate_image_file` in ScanCreateSerializer
- [ ] Test: upload a .txt file renamed to .jpg — should reject
- [ ] Commit: "feat: wire file validation into scan endpoint"

#### Task 3.2: Test authenticated scan flow end-to-end

- [ ] Signup → get token → POST /api/scan with token + image → GET /api/history → see scan in list → GET /api/history/<id> → see full detail
- [ ] Test guest flow: POST /api/scan without token → get result but no history
- [ ] Confirm Django admin shows scans, user scan counts
- [ ] Commit: "test: full auth + scan flow verified"

#### Task 3.3: Error handling consistency

- [ ] Agree on error response format across all endpoints:
  ```
  { "error": "Human readable message", "code": "MACHINE_CODE" }
  ```
  or use DRF's default `{"detail": "..."}` — just be consistent
- [ ] Add a custom exception handler in DRF settings if needed
- [ ] Handle: 400 (validation), 401 (not authenticated), 403 (not owner), 404 (scan not found), 500 (model failure)
- [ ] Commit: "feat: consistent error responses"

#### Task 3.4: Swap mock for real ML predict (when ML team delivers)

- [ ] ML team delivers `/model/predict.py` with working `predict()` function
- [ ] Update `ml/predict_wrapper.py` to import from actual path
- [ ] Test: POST /api/scan → should return real model predictions
- [ ] Verify heatmap images saved correctly to `media/heatmaps/`
- [ ] Commit: "feat: wire real ml predict replacing mock"

> [!IMPORTANT]
> Don't wait for ML team to finish backend. Mock lets you build and test everything independently. Swap is a 5-minute change.

---

## Phase 4 — Polish + Submission Prep

#### Task 4.1: Settings for production (B2)

- [ ] `DEBUG = False` in production
- [ ] `ALLOWED_HOSTS` configured
- [ ] Static files collection: `python manage.py collectstatic`
- [ ] Optional: add `gunicorn` to requirements for production serving
- [ ] Commit: "feat: production settings"

#### Task 4.2: Backend README section (B1 + B2)

- [ ] Document setup instructions (must work in < 10 minutes from clone):
  1. `cd app/backend`
  2. `python -m venv venv && venv\Scripts\activate`
  3. `pip install -r requirements.txt`
  4. `cp .env.example .env`
  5. `python manage.py migrate`
  6. `python manage.py createsuperuser`
  7. `python manage.py runserver`
- [ ] Document all API endpoints with request/response examples
- [ ] Commit: "docs: backend setup and api documentation"

#### Task 4.3: Clean clone test (B1 + B2 together)

- [ ] Clone repo fresh into temp folder
- [ ] Follow only README instructions
- [ ] Confirm: server starts, scan endpoint works, admin loads, auth works
- [ ] Must complete in under 10 minutes
- [ ] Fix anything broken
- [ ] Commit: "fix: reproducibility issues from clean clone test"

---

## Shared Conventions

| Convention | Rule |
|---|---|
| Branching | B1 works on `backend/core-api`, B2 works on `backend/auth-infra`, merge to `main` at phase boundaries |
| Commits | Conventional commits: `feat:`, `fix:`, `docs:` |
| No conflicts zone | B1 owns `scans/` and `ml/`. B2 owns `accounts/` and config-level settings. Both touch `config/urls.py` — coordinate |
| Imports between apps | Scans imports from accounts (User model). ML imports nothing from Django. Accounts imports nothing from scans |
| Testing | Postman collection shared between both members. Export and commit it |

---

## Dependency Map

```
Phase 1 (together)
  ├── B1 tasks (parallel) ──────────┐
  │   B1-1: Scan model              │
  │   B1-2: Degradation model       │
  │   B1-3: ML stub                 │
  │   B1-4: Serializers             │
  │   B1-5: Views                   │
  │   B1-6: URLs                    │
  │   B1-7: Test                    │
  │                                 │
  ├── B2 tasks (parallel) ──────────┤
  │   B2-1: JWT setup               │
  │   B2-2: Auth serializers        │
  │   B2-3: Auth views              │
  │   B2-4: Auth URLs               │
  │   B2-5: CORS/security           │
  │   B2-6: File validators ────────┼── B1 imports in Phase 3
  │   B2-7: Admin                   │
  │   B2-8: Test                    │
  │                                 │
  └── Phase 3 (together) ──────────┘
      3.1: Wire validators
      3.2: End-to-end test
      3.3: Error consistency
      3.4: ML swap (when ready)
      │
      Phase 4 (together)
      4.1: Prod settings
      4.2: README
      4.3: Clean clone test
```

---

## Time Estimates

| Phase | Time | When |
|---|---|---|
| Phase 1 (scaffold) | ~1 hour | Start immediately |
| Phase 2 (parallel) | ~4-6 hours | Same day as Phase 1 |
| Phase 3 (integration) | ~1-2 hours | After Phase 2 done |
| Phase 4 (polish) | ~1-2 hours | Day before submission |
| **Total backend** | **~8-11 hours** | |

> [!NOTE]
> With AI coding assistants (vibe-coding), Phase 2 tasks should go fast. Spend saved time on testing edge cases — reproducibility is a scoring gate.