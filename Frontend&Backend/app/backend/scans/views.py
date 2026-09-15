import logging
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Scan
from .serializers import (
    ScanCreateSerializer,
    ScanListSerializer,
    ScanDetailSerializer,
)
from .image_processor import ImageProcessor
from ml.predict_wrapper import run_prediction
from config.api_schemas import scan_create_schema, scan_history_schema, scan_detail_schema

logger = logging.getLogger(__name__)

# Single instance — stateless, so safe to reuse across requests
image_processor = ImageProcessor()


@scan_create_schema
class ScanCreateView(generics.CreateAPIView):
    """
    POST /api/scan/
    Accepts multipart image upload + optional caption.
    Runs image processing (B2-6) then inference via ml.predict_wrapper.
    Persists scan (user FK if authenticated, user=null for guests).
    """

    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ScanCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_file = serializer.validated_data["image"]
        caption = serializer.validated_data.get("caption")

        # B2-6: Process image (orientation fix, resize, thumbnail)
        try:
            processed = image_processor.process(image_file)
        except ValueError as exc:
            return Response(
                {"error": str(exc), "code": "IMAGE_PROCESSING_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Run inference on the ML-ready (224×224) image
        try:
            prediction = run_prediction(processed.ml_ready, caption=caption)
        except ValueError as exc:
            return Response(
                {"error": str(exc), "code": "INVALID_IMAGE"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error("Scan inference failed: %s", exc)
            return Response(
                {
                    "error": "Inference service failed",
                    "code": "INFERENCE_ERROR",
                    "detail": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Reset pointer for saving original file to storage
        image_file.seek(0)
        user = request.user if request.user.is_authenticated else None

        scan = Scan(
            user=user,
            image=image_file,
            image_width=processed.width,
            image_height=processed.height,
            label=prediction["label"],
            confidence=prediction["confidence"],
            threshold_used=prediction["threshold_used"],
            generator_attribution=prediction.get("generator_attribution"),
            explanation_text=prediction.get("explanation"),
            model_scores=prediction.get("model_scores"),
            provenance=prediction.get("provenance"),
            multimodal_result=prediction.get("multimodal_result"),
            adversarial_result=prediction.get("adversarial_result"),
        )

        # Save heatmap if the model returned one
        if prediction.get("heatmap_path"):
            scan.heatmap_image.name = prediction["heatmap_path"]

        # B2-6: Save thumbnail for fast-loading history list
        thumb_path = image_processor.save_thumbnail(processed.thumbnail)
        if thumb_path:
            scan.thumbnail_image.name = thumb_path

        scan.save()

        for robustness_test in prediction.get("robustness", []):
            scan.degradation_tests.create(
                transform_type=robustness_test["transform_type"],
                confidence_after=robustness_test["confidence_after"],
            )

        output_serializer = ScanDetailSerializer(
            scan, context={"request": request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


@scan_history_schema
class ScanHistoryView(generics.ListAPIView):
    """
    GET /api/history/
    Lists authenticated user's scans, ordered by -created_at.
    Paginated with page_size=20 (defined in settings).
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScanListSerializer

    def get_queryset(self):
        return Scan.objects.filter(user=self.request.user).order_by("-created_at")


@scan_detail_schema
class ScanDetailView(generics.RetrieveAPIView):
    """
    GET /api/history/<int:pk>/
    Owner-only detail view of a past scan including heatmap and explanation.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScanDetailSerializer

    def get_queryset(self):
        # Scoped strictly to current user for confidentiality and ID-enumeration protection
        return Scan.objects.filter(user=self.request.user)
