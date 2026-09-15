"""
OpenAPI schema extensions for SignalScope views.
B1-9: Rich request/response examples, accurate parameter descriptions,
and tag assignments for Swagger UI.

Import and apply these with @extend_schema on each view.
"""

from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes


# ──────────────────────────────────────────────
# Auth schemas
# ──────────────────────────────────────────────

signup_schema = extend_schema(
    tags=["Auth"],
    summary="Create a new account",
    description=(
        "Register with email, username, and password.  "
        "Returns user info + JWT access/refresh tokens (auto-login)."
    ),
    examples=[
        OpenApiExample(
            "Signup request",
            value={
                "email": "alice@example.com",
                "username": "alice",
                "password": "str0ngP@ss!",
                "password_confirm": "str0ngP@ss!",
            },
            request_only=True,
        ),
        OpenApiExample(
            "Signup success",
            value={
                "user": {"id": 1, "username": "alice", "email": "alice@example.com"},
                "tokens": {
                    "access": "eyJhbGci...",
                    "refresh": "eyJhbGci...",
                },
            },
            response_only=True,
            status_codes=["201"],
        ),
    ],
)

login_schema = extend_schema(
    tags=["Auth"],
    summary="Obtain JWT tokens",
    description="Authenticate with email/username + password.  Returns JWT pair.",
    examples=[
        OpenApiExample(
            "Login request",
            value={"email": "alice@example.com", "password": "str0ngP@ss!"},
            request_only=True,
        ),
        OpenApiExample(
            "Login success",
            value={
                "user": {"id": 1, "username": "alice", "email": "alice@example.com"},
                "tokens": {
                    "access": "eyJhbGci...",
                    "refresh": "eyJhbGci...",
                },
            },
            response_only=True,
            status_codes=["200"],
        ),
    ],
)

logout_schema = extend_schema(
    tags=["Auth"],
    summary="Blacklist refresh token (logout)",
    description="Invalidates the provided refresh token so it can't be reused.",
    examples=[
        OpenApiExample(
            "Logout request",
            value={"refresh": "eyJhbGci..."},
            request_only=True,
        ),
    ],
)

profile_schema = extend_schema(
    tags=["Auth"],
    summary="Get current user profile",
    description="Returns the authenticated user's id, username, email, and join date.",
)


# ──────────────────────────────────────────────
# Scan schemas
# ──────────────────────────────────────────────

scan_create_schema = extend_schema(
    tags=["Scans"],
    summary="Upload image for AI-detection",
    description=(
        "Accepts a multipart image (JPEG/PNG, ≤ 10 MB) plus an optional caption.  "
        "Returns a weighted ensemble verdict from VIT_Model (30%), "
        "ModelsP2 ViT+FFT (20%), and ai-image-detect-distilled (50%), plus "
        "ModelsP2 outputs for Grad-CAM, forensic cues, robustness, and "
        "adversarial defence.\n\n"
        "Authentication is optional — guests may scan but results are not saved to history."
    ),
    examples=[
        OpenApiExample(
            "Verdict response",
            value={
                "id": 42,
                "label": "ai_generated",
                "confidence": 0.88,
                "threshold_used": 0.5,
                "image": "/media/scans/abc123.jpg",
                "thumbnail_url": "/media/thumbnails/def456.jpg",
                "heatmap_url": "/media/heatmaps/ghi789.png",
                "explanation": [
                    "Periodic spectral grid artifacts: high-frequency anomaly detected."
                ],
                "generator_attribution": None,
                "provenance": {
                    "status": "no_signals",
                    "method": "EXIF_and_embedded_metadata",
                },
                "multimodal_result": {
                    "status": "not_requested",
                    "method": "metadata_grounded",
                },
                "model_scores": {
                    "vit_model_ai_generated": 0.84,
                    "modelsp2_vit_fft_ai_generated": 0.91,
                    "ai_image_detect_distilled_ai_generated": 0.76,
                    "ensemble_ai_generated": 0.80,
                    "ensemble_weights": {
                        "vit_model": 0.3,
                        "modelsp2_vit_fft": 0.2,
                        "ai_image_detect_distilled": 0.5,
                    },
                },
                "adversarial_result": {
                    "status": "completed",
                    "attack": "PGD",
                    "epsilon": 0.01,
                    "defence": "median_filter_plus_jpeg",
                    "clean": {"label": "ai_generated", "confidence": 0.91},
                    "attacked": {"label": "ai_generated", "confidence": 0.86},
                    "defended": {"label": "ai_generated", "confidence": 0.89},
                },
                "created_at": "2026-09-14T06:00:00Z",
                "degradation_tests": [
                    {"transform_type": "jpeg_qf_50", "confidence_after": 0.86},
                    {"transform_type": "resize_50_percent", "confidence_after": 0.84},
                    {"transform_type": "screenshot_simulation", "confidence_after": 0.87},
                ],
                "image_width": 512,
                "image_height": 512,
            },
            response_only=True,
            status_codes=["201"],
        ),
    ],
)

scan_history_schema = extend_schema(
    tags=["Scans"],
    summary="List scan history",
    description=(
        "Paginated list of the authenticated user's past scans, most recent first.  "
        "Page size is 20 (configurable via `?page=N`)."
    ),
)

scan_detail_schema = extend_schema(
    tags=["Scans"],
    summary="Get scan detail",
    description=(
        "Full detail of a single past scan including explanation, heatmap, "
        "and any degradation/robustness test results."
    ),
)
