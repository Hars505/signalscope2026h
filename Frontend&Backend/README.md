# SignalScope 2026 — AI Image Forensics & Explainability Platform

SignalScope is a modular monolith platform for detecting AI-generated images with calibrated confidence scoring, frequency-domain analysis, and spatial attention heatmaps.

---

## 🏗️ Repository Architecture

In accordance with the hackathon architecture specification (`ARCHITECTURE.md` §7):

```
SIGNALSCOPE-2026/
├── README.md               ← Root entry point and instructions
├── ARCHITECTURE.md         ← System architecture & design contracts
├── DEVELOPMENT_PLAN.md     ← Hackathon milestones & timeline
├── FRONTEND.md             ← Frontend design & route specification
├── ML_INTEGRATION_SPEC.md  ← Machine learning pipeline contracts
├── app/
│   ├── backend/            ← Django 5.2 + DRF REST API
│   │   ├── accounts/       ← User authentication & profiles
│   │   ├── scans/          ← Scan models, upload handler, image preprocessing
│   │   ├── ml/             ← Inference wrapper linking to ML model
│   │   ├── config/         ← Django settings, URLs, CORS, Swagger
│   │   ├── manage.py       ← Django CLI
│   │   └── requirements.txt
│   └── frontend/           ← React 18 + Vite + Tailwind CSS SPA
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
├── frontend/               ← Junction alias to app/frontend
└── venv/                   ← Python virtual environment
```

---

## 🚀 Quick Start (< 5 minutes)

### 1. Backend Service (Django + DRF)

```bash
# Navigate to backend
cd app/backend

# Activate virtual environment
# Windows:
..\..\venv\Scripts\activate
# Linux/macOS:
source ../../venv/bin/activate

# Apply migrations (if not already applied)
python manage.py migrate

# Run backend tests
python manage.py test

# Start backend server on port 8000
python manage.py runserver 8000
```
- **Backend API**: `http://127.0.0.1:8000/`
- **Swagger UI**: `http://127.0.0.1:8000/api/docs/swagger/`
- **ReDoc**: `http://127.0.0.1:8000/api/docs/redoc/`
- **OpenAPI Schema**: `http://127.0.0.1:8000/api/docs/schema/`
- **Admin Panel**: `http://127.0.0.1:8000/admin/`

---

### 2. Frontend Application (React + Vite)

```bash
# Navigate to frontend
cd app/frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Start development server on port 5173
npm run dev
```
- **Frontend App**: `http://localhost:5173/`
- **Live / Mock Mode Toggle**: Click the "Live API:8000" / "Mock Engine" switch in the navigation bar to test either live backend responses or the client-side mock simulation.

---

## ☁️ Deploying to Vercel + Render

Deploy the two applications as separate services:

### Backend on Render

1. Create a new **Blueprint** in Render using the repository-root `render.yaml`.
2. Set `FRONTEND_URL` to the final Vercel URL, for example
   `https://signalscope.vercel.app`.
3. Render runs Django with `SIGNALSCOPE_ENABLE_ML=False` by default. This is intentional:
   model checkpoints are excluded from Git and Vercel/Render serverless-style deployments
   should not download multi-gigabyte training artifacts during a build.
4. Copy the deployed Render URL, such as `https://signalscope-api.onrender.com`.

The Render service uses SQLite and local media storage for the demo deployment. Render's
filesystem is ephemeral, so use a managed PostgreSQL database and object storage
(Cloudinary, S3, or equivalent) before treating uploaded scans as persistent production data.

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the project root directory to `Frontend&Backend/app/frontend`.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Add these environment variables:

   ```
   VITE_API_URL=https://signalscope-api.onrender.com
   VITE_USE_MOCK_API=false
   ```

The included `app/frontend/vercel.json` rewrites all SPA routes to `index.html`, so
routes such as `/analyze` and `/history` work after a page refresh.
