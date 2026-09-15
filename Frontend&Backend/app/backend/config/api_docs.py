"""
DRF Spectacular (OpenAPI 3.0) configuration for SignalScope.
B1-9: Enhanced Swagger UI + ReDoc with request/response examples.

Endpoints added:
    /api/docs/schema/   — raw OpenAPI JSON/YAML
    /api/docs/swagger/  — interactive Swagger UI
    /api/docs/redoc/    — ReDoc reader-friendly view
"""

SPECTACULAR_SETTINGS = {
    "TITLE": "SignalScope API",
    "DESCRIPTION": (
        "AI-Generated Image Detection API.\n\n"
        "**Core**: Upload an image and receive a real-vs-AI-generated verdict "
        "with calibrated confidence.\n\n"
        "**Bonus modules**: Faithful explanations (A), robustness analysis (C), "
        "metadata/provenance (D), metadata-grounded caption consistency (E), "
        "batch processing (F).\n\n"
        "Authentication uses JWT Bearer tokens — obtain a pair via "
        "`POST /api/auth/login/` and pass the access token in the "
        "`Authorization: Bearer <token>` header."
    ),
    "VERSION": "1.0.0",
    "CONTACT": {
        "name": "SignalScope Team",
    },
    "LICENSE": {
        "name": "MIT",
    },
    "SERVE_INCLUDE_SCHEMA": False,

    # --- Grouping & ordering ---
    "TAGS": [
        {"name": "Auth", "description": "Signup, login, logout, profile, token refresh."},
        {"name": "Scans", "description": "Upload images for AI-detection, view history."},
        {"name": "Admin", "description": "Django admin (browser only)."},
    ],

    # --- Security ---
    "SECURITY": [{"BearerAuth": []}],
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },

    # --- Schema generation tweaks ---
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "LabelEnum": "scans.models.Scan.LABEL_CHOICES",
    },
}
