# Frontend — SignalScope (React)

> Tags: **[REQ]** stated in the problem statement · **[ASSUMPTION]** not stated, default chosen · **[RECOMMEND]** engineering choice · **[BONUS]** tied to modules A–G.
> None of this file's stack detail is dictated by the brief — React was your stated preference; the brief only requires "a minimal interface (web app, notebook UI, or CLI + screenshots)" [REQ §3.1].

## 1. Stack

- **React 18 + Vite** [your stated preference / RECOMMEND for the build tool] — fast dev server, minimal config.
- **Routing**: `react-router-dom` — small app, 4–5 routes max.
- **State/data fetching**: `@tanstack/react-query` [RECOMMEND] for API calls + caching (scan submission, history list) — avoids hand-rolling loading/error state everywhere; a plain `fetch` + `useState` is an acceptable lighter alternative if time is tighter.
- **Styling**: [RECOMMEND] plain CSS modules or Tailwind — either is fine; avoid pulling in a full component-library dependency you don't have time to theme.
- **No Redux/global state library** [RECOMMEND] — the app's state (current scan, history list, auth) is small enough for React Query + a small auth context.

## 2. Folder Structure

```
/frontend
  /src
    /api
      client.js          ← fetch wrapper, base URL, auth header injection
      scans.js            ← submitScan(), fetchHistory(), fetchScan(id)
      auth.js              ← login(), signup(), logout()
    /components
      UploadDropzone.jsx
      ConfidenceBadge.jsx
      HeatmapOverlay.jsx
      ExplanationPanel.jsx
      GeneratorAttributionChip.jsx      (only if Module B built)
      RobustnessNote.jsx                (only if Module C built)
      HistorySidebar.jsx
      HistoryItem.jsx
      AuthForm.jsx
    /pages
      HomePage.jsx          ← upload + result (guest or logged-in)
      LoginPage.jsx
      SignupPage.jsx
    /context
      AuthContext.jsx
    App.jsx
    main.jsx
  package.json
  vite.config.js
  .env.example
```

## 3. Routes

| Path | Page | Auth required |
|---|---|---|
| `/` | HomePage (upload + result + sidebar if logged in) | No |
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/scan/:id` | HomePage pre-loaded with a past scan (from sidebar click) | Yes |

## 4. Key Components

| Component | Responsibility |
|---|---|
| `UploadDropzone` | Drag-and-drop + file picker, client-side type/size validation before upload, keyboard-accessible |
| `ConfidenceBadge` | Renders "Likely AI-generated / Likely real" + confidence %, neutral colour scale (see `UI_UX.md` §6 copy rules) |
| `HeatmapOverlay` | Renders the returned heat-map image over the original, with a show/hide toggle |
| `ExplanationPanel` | Renders the cue-list text returned by the API — **never generates or rewrites explanation text client-side**, only displays what the backend sent, to preserve faithfulness |
| `HistorySidebar` / `HistoryItem` | Lists past scans for a logged-in user, click to load `/scan/:id` |
| `AuthForm` | Shared login/signup form component |

## 5. API Contract (consumed from the backend — see `BACKEND_ML.md` for the server side)

```
POST /api/scan
  Request:  multipart/form-data { image: File, caption?: string }
  Response: {
    id, label: "real"|"ai_generated", confidence: float,
    heatmap_url?: string, explanation?: string[],
    generator_attribution?: string,
    robustness_note?: string
  }

GET /api/history            (auth required)
  Response: [{ id, label, confidence, thumbnail_url, created_at }, ...]

GET /api/history/:id        (auth required)
  Response: same shape as POST /api/scan's response

POST /api/auth/signup       { email, password }
POST /api/auth/login        { email, password } → { token } (if JWT) or sets session cookie
POST /api/auth/logout
```

## 6. State & Data Flow

1. `UploadDropzone` → calls `submitScan(file, caption)` → React Query mutation → shows loading state → on success, renders `ConfidenceBadge` + `ExplanationPanel` + `HeatmapOverlay`.
2. On mount (if logged in), `HistorySidebar` calls `fetchHistory()` via a React Query query; new scans invalidate/refetch this query so the sidebar updates without a manual refresh.
3. `AuthContext` holds the current user/token, read by `HistorySidebar` to decide whether to render the "sign up to save history" prompt or the real list (see `UI_UX.md` §4 states table).

## 7. Environment Variables

```
VITE_API_BASE_URL=http://localhost:8000
```

Keep this file (`.env.example`) committed with placeholder values; the real `.env` stays out of git per the security requirements in `REQUIREMENTS.md` §8.

## 8. Responsible UI Copy (enforced in components, not just design docs)

Hard-code these strings centrally (e.g. `src/copy.js`) rather than inline per-component, so wording stays consistent and auditable against the "no over-claiming" rubric dimension:

```js
export const COPY = {
  labelLikelySynthetic: (pct) => `Likely AI-generated — ${pct}% confidence`,
  labelLikelyReal: (pct) => `Likely real — ${pct}% confidence`,
  lowConfidence: (pct) => `Not confident either way (${pct}%) — treat as inconclusive`,
  scopeNotice: "Detects AI-generated images — not for identifying people or verifying news events.",
};
```

## 9. Build & Run

```bash
cd frontend
npm install
npm run dev        # local dev server, proxies to VITE_API_BASE_URL
npm run build       # production build, output in /dist
```

## 10. Out of Scope for the Frontend

Social login, MFA, i18n/localization, a design-system component library, offline/PWA support, mobile-native builds — none of these are requested or scored; adding them would be over-engineering against the timeline in `DEVELOPMENT_PLAN.md`.
