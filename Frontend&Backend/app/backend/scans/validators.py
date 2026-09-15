"""
Image upload validators for SignalScope.
B2-6: MIME type, file size, and Pillow integrity checks.
B1 imports validate_image_file in the scan serializer.
"""

from PIL import Image
from rest_framework.exceptions import ValidationError

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_image_file(file):
    """
    Validate an uploaded image file:
    1. MIME type must be JPEG or PNG.
    2. File size must be under 10MB.
    3. File must be a valid image (Pillow can open it).

    Raises ValidationError with clear message on failure.
    """
    # Check MIME type
    if hasattr(file, 'content_type'):
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise ValidationError(
                f"Unsupported file type: {file.content_type}. "
                f"Only JPEG and PNG images are accepted."
            )

    # Check file size
    if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
        size_mb = file.size / (1024 * 1024)
        raise ValidationError(
            f"File too large: {size_mb:.1f}MB. Maximum allowed is 10MB."
        )

    # Verify with Pillow — catches renamed non-image files
    try:
        file.seek(0)
        img = Image.open(file)
        img.verify()  # verify without fully loading into memory
        file.seek(0)  # reset for downstream consumers
    except Exception:
        raise ValidationError(
            "File is not a valid image. Upload a valid JPEG or PNG."
        )
