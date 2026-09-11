"""
Custom DRF exception handler for SignalScope.
Standardizes all error responses to:
{
    "error": "Human readable message",
    "code": "MACHINE_CODE",
    "details": { ... }  # optional for field validation errors
}
"""

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

STATUS_CODE_MAP = {
    400: "VALIDATION_ERROR",
    401: "NOT_AUTHENTICATED",
    403: "PERMISSION_DENIED",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    429: "THROTTLED",
    500: "SERVER_ERROR",
}


def custom_exception_handler(exc, context):
    """
    Standardize all exception responses into { error, code, [details] }.
    Catches DRF APIExceptions, Django Http404/PermissionDenied, and unhandled 500s.
    """
    response = exception_handler(exc, context)

    if response is not None:
        default_code = STATUS_CODE_MAP.get(response.status_code, "ERROR")
        data = response.data

        if isinstance(data, dict):
            # Case 1: Standard DRF {"detail": "..."}
            if "detail" in data:
                detail_obj = data["detail"]
                msg = str(detail_obj)
                code = getattr(detail_obj, "code", default_code).upper()
                # Use mapped default code if code is generic error
                if code in ("ERROR", "INVALID"):
                    code = default_code
                response.data = {
                    "error": msg,
                    "code": code,
                }
            # Case 2: Already structured {"error": "..."}
            elif "error" in data:
                response.data = {
                    "error": str(data["error"]),
                    "code": data.get("code", default_code),
                }
                if "detail" in data:
                    response.data["detail"] = data["detail"]
            # Case 3: Serializer field errors: {"field": ["msg1", ...]}
            else:
                first_msg = "Validation failed."
                for field, errors in data.items():
                    if isinstance(errors, (list, tuple)) and len(errors) > 0:
                        first_msg = str(errors[0])
                        break
                    elif isinstance(errors, str):
                        first_msg = errors
                        break
                response.data = {
                    "error": first_msg,
                    "code": "VALIDATION_ERROR",
                    "details": data,
                }

        elif isinstance(data, list):
            first_msg = str(data[0]) if len(data) > 0 else "Validation failed."
            response.data = {
                "error": first_msg,
                "code": "VALIDATION_ERROR",
                "details": data,
            }
        else:
            response.data = {
                "error": str(data),
                "code": default_code,
            }
    else:
        # Case 4: Unhandled server errors (HTTP 500)
        logger.error("Unhandled API error: %s", exc, exc_info=True)
        response = Response(
            {
                "error": "An unexpected server error occurred.",
                "code": "SERVER_ERROR",
                "detail": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
