from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import Scan, DegradationTest
from .validators import validate_image_file


class DegradationTestSerializer(serializers.ModelSerializer):
    """Nested serializer for Module C robustness checks."""

    class Meta:
        model = DegradationTest
        fields = ["id", "transform_type", "confidence_after"]
        read_only_fields = fields


class ScanCreateSerializer(serializers.Serializer):
    """Payload validator for POST /api/scan."""

    image = serializers.FileField(required=True, validators=[validate_image_file])
    caption = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, write_only=True
    )


class ScanListSerializer(serializers.ModelSerializer):
    """Summary item for GET /api/history — includes thumbnail for fast loading."""

    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Scan
        fields = ["id", "label", "confidence", "image", "thumbnail_url", "created_at"]
        read_only_fields = fields

    @extend_schema_field(OpenApiTypes.URI)
    def get_thumbnail_url(self, obj):
        if not obj.thumbnail_image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.thumbnail_image.url)
        return obj.thumbnail_image.url


class ScanDetailSerializer(serializers.ModelSerializer):
    """Full scan verdict detail with explanation, heatmap, thumbnail, and degradation tests."""

    heatmap_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
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
            "thumbnail_url",
            "heatmap_url",
            "explanation",
            "model_scores",
            "provenance",
            "multimodal_result",
            "adversarial_result",
            "generator_attribution",
            "image_width",
            "image_height",
            "created_at",
            "degradation_tests",
        ]
        read_only_fields = fields

    @extend_schema_field(OpenApiTypes.URI)
    def get_heatmap_url(self, obj):
        if not obj.heatmap_image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.heatmap_image.url)
        return obj.heatmap_image.url

    @extend_schema_field(OpenApiTypes.URI)
    def get_thumbnail_url(self, obj):
        if not obj.thumbnail_image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.thumbnail_image.url)
        return obj.thumbnail_image.url
