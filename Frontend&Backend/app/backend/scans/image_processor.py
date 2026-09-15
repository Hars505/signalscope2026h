"""
Image processing service for SignalScope.
B2-6: Resize, format conversion, thumbnail generation, EXIF orientation fix.

Called by ScanCreateView before ML inference and again before saving to storage.
Keeps the original upload untouched; all transforms produce new in-memory copies.
"""

import io
import logging
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile, SimpleUploadedFile
from PIL import Image, ExifTags, ImageOps

logger = logging.getLogger(__name__)

# --- Constants ---
# Max edge length the ML model accepts (ViT-B/16 default is 224, but we keep
# a higher intermediate so the heat-map / UI preview stays sharp).
ML_INPUT_SIZE = (224, 224)
THUMBNAIL_SIZE = (256, 256)
THUMBNAIL_QUALITY = 85
MAX_STORAGE_EDGE = 1024  # cap saved images so disk usage stays sane


@dataclass
class ProcessedImage:
    """Container for all image variants produced by the processor."""
    original: Image.Image       # orientation-corrected, RGB
    ml_ready: Image.Image       # resized for model input (224×224)
    thumbnail: Image.Image      # small preview for frontend history list
    width: int                  # original dimensions (after orientation fix)
    height: int
    format: str                 # detected source format (JPEG / PNG)


class ImageProcessor:
    """
    Stateless service that turns an uploaded file into:
      1. An orientation-corrected, RGB PIL image  (original)
      2. A 224×224 tensor-ready image              (ml_ready)
      3. A 256×256 JPEG thumbnail                  (thumbnail)

    All methods are synchronous — image ops are CPU-bound and
    short-lived at single-image scale, so async adds no benefit.
    """

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def process(self, uploaded_file) -> ProcessedImage:
        """
        Main entry point.  Accepts a Django UploadedFile or file-like object.

        Returns a ProcessedImage with all variants.
        Raises ValueError on corrupt / unparseable input.
        """
        try:
            uploaded_file.seek(0)
            img = Image.open(uploaded_file)
            source_format = img.format or "JPEG"
            img = self._fix_orientation(img)
            img = img.convert("RGB")
        except Exception as exc:
            raise ValueError(f"Cannot process image: {exc}") from exc

        width, height = img.size

        ml_ready = self._resize_for_model(img)
        thumbnail = self._make_thumbnail(img)

        return ProcessedImage(
            original=img,
            ml_ready=ml_ready,
            thumbnail=thumbnail,
            width=width,
            height=height,
            format=source_format,
        )

    def to_django_file(
        self,
        pil_image: Image.Image,
        *,
        name: str = "",
        fmt: str = "JPEG",
        quality: int = 90,
    ) -> SimpleUploadedFile:
        """Convert a PIL image back into a Django-uploadable file object."""
        buf = io.BytesIO()
        save_kwargs = {"format": fmt}
        if fmt.upper() == "JPEG":
            save_kwargs["quality"] = quality
        pil_image.save(buf, **save_kwargs)
        buf.seek(0)
        content_type = "image/jpeg" if fmt.upper() == "JPEG" else "image/png"
        if not name:
            ext = "jpg" if fmt.upper() == "JPEG" else "png"
            name = f"{uuid.uuid4().hex}.{ext}"
        return SimpleUploadedFile(name, buf.read(), content_type=content_type)

    def save_thumbnail(self, thumbnail: Image.Image) -> Optional[str]:
        """
        Persist a thumbnail to MEDIA_ROOT/thumbnails/ and return
        the relative storage path (e.g. 'thumbnails/abc123.jpg').
        Returns None on failure.
        """
        thumb_dir = Path(settings.MEDIA_ROOT) / "thumbnails"
        thumb_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = thumb_dir / filename
        try:
            thumbnail.save(filepath, format="JPEG", quality=THUMBNAIL_QUALITY)
            return f"thumbnails/{filename}"
        except Exception as exc:
            logger.error("Failed to save thumbnail: %s", exc)
            return None

    def cap_for_storage(self, img: Image.Image) -> Image.Image:
        """
        Downscale to MAX_STORAGE_EDGE if either dimension exceeds it.
        Preserves aspect ratio.  Used before writing the uploaded original
        to disk so we don't store 4096×4096 images on a demo server.
        """
        if max(img.size) <= MAX_STORAGE_EDGE:
            return img
        img.thumbnail((MAX_STORAGE_EDGE, MAX_STORAGE_EDGE), Image.LANCZOS)
        return img

    # ------------------------------------------------------------------ #
    #  Private helpers                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _fix_orientation(img: Image.Image) -> Image.Image:
        """
        Apply EXIF orientation tag and strip it, so the image
        renders correctly regardless of viewer.
        """
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass  # no EXIF or unsupported tag — safe to ignore
        return img

    @staticmethod
    def _resize_for_model(img: Image.Image) -> Image.Image:
        """
        Resize to ML_INPUT_SIZE (224×224) using high-quality
        LANCZOS downsampling.  The ML model expects this exact size.
        """
        return img.resize(ML_INPUT_SIZE, Image.LANCZOS)

    @staticmethod
    def _make_thumbnail(img: Image.Image) -> Image.Image:
        """
        Create a THUMBNAIL_SIZE (256×256) preview, preserving
        aspect ratio (pads / letterboxes are avoided — `.thumbnail()`
        scales to fit within the box).
        """
        thumb = img.copy()
        thumb.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
        return thumb
