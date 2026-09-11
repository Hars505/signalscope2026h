# UI/UX — SignalScope

> Tags: **[REQ]** stated in the problem statement · **[ASSUMPTION]** not stated, default chosen · **[RECOMMEND]** design choice · **[BONUS]** tied to modules A–G.

None of the pixel-level design is specified by the brief — the requirements that *do* constrain the UI are: responsible, non-accusatory language [REQ §1/§4.3], honest uncertainty communication [REQ §4.3/§11], and basic accessibility [REQ §9 UX axis]. Everything else below is [RECOMMEND]/[ASSUMPTION] scoped deliberately small for a 4-day build.

## 1. Design Principles

1. **Never state a verdict as certain.** Copy always reads "likely AI-generated (88% confidence)" or "likely real," never "this is fake."
2. **Show uncertainty honestly.** A low-confidence result must visually and textually say so — don't let a 51%-confidence call look identical to a 99%-confidence one.
3. **Explain, don't accuse.** Explanation copy describes cues found in the image, never claims about who made it or why.
4. **Keep it boring on purpose.** No dark patterns, no alarming red "FAKE!" banners — a measured, neutral tone fits the trust & safety domain and directly serves the "No over-claiming" rubric dimension [REQ §4.3].

## 2. Screens

### 2.1 Upload / Home screen
- Drag-and-drop zone + "browse file" fallback button (keyboard-accessible) [REQ, accessibility].
- Optional caption field, shown only if Module E is attempted [BONUS-E].
- Empty state: short one-line explainer of what the tool does and its scope ("Detects AI-generated images — not for identifying people or verifying news events").

### 2.2 Result view
- **Verdict badge**: "Likely AI-generated" / "Likely real" + confidence, colour-coded on a neutral scale (e.g. grey→amber→blue) rather than red/green alarm colours — avoids visually "convicting" a real photo.
- **Confidence meter**: a simple bar/gauge, not just a number — makes low confidence visually obvious.
- **Explanation panel** [BONUS-A]: heat-map overlay on the image (toggle on/off) + a short bullet list of cues, each grounded in what the heat-map actually highlighted (see `BACKEND_ML.md` for how this is enforced).
- **Generator attribution chip** [BONUS-B, only if built]: e.g. "Likely diffusion-family."
- **Robustness note** [BONUS-C, only if built]: "Verdict stable after re-compression (confidence −0.04)."
- **Uncertainty banner**: shown whenever confidence falls below a stated threshold, e.g. "The model isn't confident about this one — treat this result as inconclusive."

### 2.3 History sidebar (chat-style)
- Left-hand panel listing past scans, most recent first: thumbnail, verdict badge, relative timestamp.
- Clicking an entry reopens that scan's full result view (FR-7).
- Empty state for a new user: "Your past scans will appear here."
- [ASSUMPTION] a "clear history" action, given the data-retention note in `REQUIREMENTS.md` §9 — optional, low priority.

### 2.4 Login / Signup
- Minimal form: email/username + password. No social login, no MFA — out of scope for the timeline.
- Guest mode remains available without an account (FR-1) so a judge can test the core in seconds without registering — [RECOMMEND] to protect the reproducibility gate.

### 2.5 Admin
- **Not a custom screen** — Django's built-in admin, lightly customized: a `User` list showing scan counts per user, and standard activate/deactivate/delete actions. Building a bespoke admin UI here would be scope creep with no scoring benefit (see `ARCHITECTURE.md` §10).

## 3. Key User Flows

**Flow A — Guest quick check**
Home → drop image → (loading state, ~1–3s) → result view with verdict + confidence → optionally view explanation.

**Flow B — Registered user, recurring use**
Login → home (sidebar populated) → drop image → result view → scan auto-appended to sidebar → click an older sidebar entry → same result view rendered from stored data.

**Flow C — Admin**
Log into `/admin` → view user list with scan counts → deactivate or delete a user if needed.

## 4. States to Design For

| State | UI behaviour |
|---|---|
| Loading (inference in progress) | Spinner/skeleton, disable re-submit |
| Low confidence (near threshold) | Uncertainty banner, muted badge colour |
| Upload error (bad format/too large) | Inline, specific error message — never a blank failure |
| No history (new user) | Friendly empty state, not a blank sidebar |
| Guest vs. logged-in | Sidebar hidden/replaced with a "sign up to save history" prompt for guests |

## 5. Accessibility Checklist [REQ, part of the UX scoring axis]

- Sufficient colour contrast on verdict badges and confidence meters (don't rely on colour alone — pair with text/icons).
- Upload control reachable and operable via keyboard.
- Alt text on the heat-map image describing that it's a model-generated overlay, not a factual annotation.
- Form labels properly associated with inputs on login/signup.

## 6. Content/Copy Guide [REQ-driven — directly scored under Explanation & Trust and UX axes]

| Situation | Use | Avoid |
|---|---|---|
| High-confidence synthetic | "Likely AI-generated — 91% confidence" | "This image is fake" |
| High-confidence real | "Likely real — 94% confidence" | "This image is authentic" / "Verified real" |
| Low confidence | "Not confident either way (54%) — treat as inconclusive" | Hiding the low score or rounding it away |
| Explanation | "Texture near the highlighted region looks smoother than expected for fabric" | "The AI clearly generated this because..." (overclaiming causal certainty) |
| Any verdict | Reference to "the model's assessment" | Reference implying human/legal judgement ("verdict," "guilty," "proof") — keep even the internal naming ("verdict") out of user-facing copy where possible |

## 7. Out of Scope for UI/UX

Face/person-identification UI of any kind, political-content labeling UI, any screen implying legal/journalistic certainty, multi-tenant/org account management screens.
