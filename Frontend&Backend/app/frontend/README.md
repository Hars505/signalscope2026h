# SignalScope Frontend — React.js + Vite + TypeScript

A high-performance, dark-mode media forensics web application for automated image authenticity detection. Built with **React.js**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**, adhering to the **Cruip Stellar** SaaS visual aesthetic.

---

## 🌟 Architectural Overview

SignalScope decomposes visual inputs across spatial and frequency domains to determine whether an image is **Likely Real** or **Likely AI-Generated**.

```
Upload Image (JPEG/PNG/WEBP)
      │
      ├───► Spatial Branch (ViT-B/16 Patch Self-Attention)
      │
      └───► Spectral Branch (2D-FFT Azimuthal Power Spectrum)
                  │
                  ▼
         Cross-Attention Fusion
                  │
                  ▼
         Binary Classification Head
                  │
                  ▼
         Temperature Scaling Calibration (T=1.42)
                  │
                  ▼
         Calibrated Probability & Grad-CAM Heatmap
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Address of the SignalScope Django backend |
| `VITE_USE_MOCK_API` | `true` | When `true`, activates in-memory simulated inference & canvas Grad-CAM heatmaps |

*Note: You can also toggle between Mock Mode and Live API at runtime via the discrete toggle in the navbar.*

### 3. Start Development Server
```bash
npm run dev
```
The app will run locally at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

---

## 🧭 Page Routes

- `/` — **Landing Page**: Cruip Stellar hero section with interactive ML pipeline visualizer, how-it-works cards, and technical architecture breakdown.
- `/analyze` — **Image Analysis**: Drag-and-drop file upload, high-tech multi-stage scanning beam animation, calibrated probability gauge, Grad-CAM attention viewer (with opacity blend slider), grounded forensic explanations, and degradation stability metrics.
- `/dashboard` — **Forensic Console**: Real-time evaluation metrics derived strictly from actual history logs (no fabricated benchmarks).
- `/history` — **Telemetry History**: Searchable, filterable audit log of previous evaluations with quick detail inspection modals.
- `/about` — **Technology Deep Dive**: Detailed explanation of ViT-B/16, 2D-FFT spectral residuals, temperature scaling calibration, and ethical AI boundaries.

---

## 🔌 API Integration

SignalScope connects directly to the Django REST Framework endpoints:
- `POST /api/scan/` — Multipart upload (`image`, optional `caption`) returning `ScanDetailSerializer` payload.
- `GET /api/history/` — Paginated history listing.
- `GET /api/history/<id>/` — Full scan report with heatmap and degradation tests.

All client requests are centralized in [`src/lib/api.ts`](./src/lib/api.ts).
