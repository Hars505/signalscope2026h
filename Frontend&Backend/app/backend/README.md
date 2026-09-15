# SignalScope Backend API

Modular monolith backend for SignalScope — AI-generated image detection & explainability platform. Built with Django 5.2, Django REST Framework, and SimpleJWT.

---

## 1. Quick Setup (< 10 minutes)

### Prerequisites
- Python 3.10+ (tested on Python 3.11)
- `pip`

### Step-by-Step

```bash
# 1. Navigate to backend directory
cd app/backend

# 2. Create and activate virtual environment
# On Windows (PowerShell/cmd):
python -m venv venv
.\venv\Scripts\activate

# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# On Windows:
copy .env.example .env
# On Linux/macOS:
cp .env.example .env

# 5. Apply database migrations
python manage.py migrate

# 6. Create admin superuser (interactive)
python manage.py createsuperuser

# 7. Start local development server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.  
Admin panel: `http://127.0.0.1:8000/admin/`.

### ML model integration

`POST /api/scan/` uses a weighted probability ensemble:

| Model | Weight | Checkpoint |
|---|---:|---|
| VIT_Model | 30% | `VIT_Model/ML/VIT_models/best_model.pt` |
| ModelsP2 ViT+FFT | 20% | `ModelsP2/models/trained/signalscope-final` |
| ai-image-detect-distilled | 50% | `ai-image-detect-distilled/` |

The final label is `ai_generated` when the weighted AI probability is at least
0.5, and confidence is the probability of the returned class. ModelsP2 also
provides Grad-CAM heatmaps, forensic cues, degradation checks, and PGD/active
defence evaluation. The API also reports EXIF/XMP/C2PA-like embedded metadata
signals without treating their absence as proof of authenticity. Caption
consistency is completed only when an embedded description is available; a
caption alone is never presented as visual understanding. Generator attribution
remains unavailable unless a trained attribution checkpoint is supplied. Set
`SIGNALSCOPE_ENABLE_ML=False` for a lightweight fallback-only development
server.

---

## 2. Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `django-insecure-...` | Django secret key (change in production) |
| `DEBUG` | `True` | Debug mode (`True` for dev, `False` for production) |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list of allowed host headers |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for Vite dev server |

---

## 3. API Endpoints Reference

All endpoints accept and return `application/json`, except `POST /api/scan/` which accepts `multipart/form-data`.

### Authentication

#### 1. Register User
- **Method & Route**: `POST /api/auth/signup/`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "username": "priya",
    "email": "priya@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "priya",
      "email": "priya@example.com"
    },
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

#### 2. Login
- **Method & Route**: `POST /api/auth/login/`
- **Auth**: None
- **Request Body**: (Accepts email or username)
  ```json
  {
    "email": "priya@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "priya",
      "email": "priya@example.com"
    },
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

#### 3. Refresh Access Token
- **Method & Route**: `POST /api/auth/token/refresh/`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

#### 4. Logout (Blacklist Refresh Token)
- **Method & Route**: `POST /api/auth/logout/`
- **Auth**: Bearer Token required (`Authorization: Bearer <access_token>`)
- **Request Body**:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "detail": "Successfully logged out."
  }
  ```

#### 5. Current User Profile
- **Method & Route**: `GET /api/auth/me/`
- **Auth**: Bearer Token required
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "username": "priya",
    "email": "priya@example.com",
    "date_joined": "2026-09-11T12:00:00Z"
  }
  ```

---

### Scanning & History

#### 6. Upload & Classify Image
- **Method & Route**: `POST /api/scan/`
- **Auth**: Optional (Guests allowed; scans persist under user if Bearer Token provided)
- **Request Format**: `multipart/form-data`
- **Parameters**:
  - `image` (file, required): JPEG or PNG, max 10MB
  - `caption` (string, optional): contextual text
- **Response (`200 OK`)**:
  ```json
  {
    "id": 42,
    "label": "ai_generated",
    "confidence": 0.88,
    "threshold_used": 0.5,
    "heatmap_url": "/media/heatmaps/heatmap_42.png",
    "explanation": [
      "Handle geometry is physically inconsistent",
      "Reflections don't match the light source"
    ],
    "generator_attribution": "diffusion-family",
    "created_at": "2026-09-11T12:15:00Z"
  }
  ```

#### 7. Scan History List
- **Method & Route**: `GET /api/history/`
- **Auth**: Bearer Token required
- **Query Params**: `?page=1` (Page size 20)
- **Response (`200 OK`)**:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 42,
        "label": "ai_generated",
        "confidence": 0.88,
        "image": "/media/scans/sample.jpg",
        "created_at": "2026-09-11T12:15:00Z"
      }
    ]
  }
  ```

#### 8. Scan Detail
- **Method & Route**: `GET /api/history/<id>/`
- **Auth**: Bearer Token required (owner only)
- **Response (`200 OK`)**:
  ```json
  {
    "id": 42,
    "label": "ai_generated",
    "confidence": 0.88,
    "threshold_used": 0.5,
    "image": "/media/scans/sample.jpg",
    "heatmap_url": "/media/heatmaps/heatmap_42.png",
    "explanation": [
      "Handle geometry is physically inconsistent",
      "Reflections don't match the light source"
    ],
    "generator_attribution": "diffusion-family",
    "created_at": "2026-09-11T12:15:00Z",
    "degradation_tests": []
  }
  ```

---

## 4. Error Response Format

Standardized across all endpoints:
```json
{
  "error": "Human readable error description",
  "code": "MACHINE_READABLE_CODE"
}
```

Common status codes:
- `400 Bad Request` (`VALIDATION_ERROR`, `INVALID_CREDENTIALS`)
- `401 Unauthorized` (`NOT_AUTHENTICATED`, `TOKEN_INVALID`)
- `403 Forbidden` (`PERMISSION_DENIED`)
- `404 Not Found` (`NOT_FOUND`)
- `429 Too Many Requests` (`THROTTLED`)
- `500 Internal Server Error` (`SERVER_ERROR`)

---

## 5. Testing & Verification

Run the complete test suite:
```bash
python manage.py test
```

Collect static assets for production:
```bash
python manage.py collectstatic --noinput
```

Production serving (Linux/Docker):
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```
