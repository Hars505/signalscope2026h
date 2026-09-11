from rest_framework import serializers
from PIL import Image
from .models import Scan, DegradationTest

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png"]


class DegradationTestSerializer(serializers.ModelSerializer):
    """Nested serializer for Module C robustness checks."""

    class Meta:
        model = DegradationTest
        fields = ["id", "transform_type", "confidence_after"]
        read_only_fields = fields


class ScanCreateSerializer(serializers.Serializer):
    """Payload validator for POST /api/scan."""

    image = serializers.ImageField(required=True)
    caption = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, write_only=True
    )

    def validate_image(self, value):
        if value.size > MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError("File size exceeds 10MB limit.")

        content_type = getattr(value, "content_type", None)
        if content_type and content_type.lower() not in ALLOWED_IMAGE_MIMES:
            raise serializers.ValidationError(
                "Invalid MIME type. Only JPEG and PNG are allowed."
            )

        # Verify underlying image integrity
        try:
            value.seek(0)
            img = Image.open(value)
            img.verify()
            if img.format not in ["JPEG", "PNG"]:
                raise serializers.ValidationError("Only JPEG and PNG images supported.")
            value.seek(0)
        except Exception as exc:
            raise serializers.ValidationError(f"Invalid image file: {exc}")

        return value


class ScanListSerializer(serializers.ModelSerializer):
    """Summary item for GET /api/history."""

    class Meta:
        model = Scan
        fields = ["id", "label", "confidence", "image", "created_at"]
        read_only_fields = fields


class ScanDetailSerializer(serializers.ModelSerializer):
    """Full scan verdict detail with explanation, heatmap, and degradation tests."""

    heatmap_url = serializers.SerializerMethodField()
    explanation = serializers.JSONField(source="explanation_text", read_only=True)
    degradation_tests = DegradationTestSerializer(many=True, read_only=True)

    class Meta:
        model = Scan
        fields = [
            "id",
            "label",
            "confidence",
            "threshold_used",
            "image",
            "heatmap_url",
            "explanation",
            "generator_attribution",
            "created_at",
            "degradation_tests",
        ]
        read_only_fields = fields

    def get_heatmap_url(self, obj):
        if not obj.heatmap_image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.heatmap_image.url)
        return obj.heatmap_image.url
