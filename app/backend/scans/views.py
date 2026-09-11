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
from ml.predict_wrapper import run_prediction

logger = logging.getLogger(__name__)


class ScanCreateView(generics.CreateAPIView):
    """
    POST /api/scan/
    Accepts multipart image upload + optional caption.
    Runs inference via ml.predict_wrapper.
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

        # Run inference
        try:
            prediction = run_prediction(image_file, caption=caption)
        except ValueError as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as exc:
            logger.error("Scan inference failed: %s", exc)
            return Response(
                {"error": "Inference service failed", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Reset pointer for saving file to storage
        image_file.seek(0)
        user = request.user if request.user.is_authenticated else None

        scan = Scan(
            user=user,
            image=image_file,
            label=prediction["label"],
            confidence=prediction["confidence"],
            threshold_used=prediction["threshold_used"],
            generator_attribution=prediction.get("generator_attribution"),
            explanation_text=prediction.get("explanation"),
        )

        if prediction.get("heatmap_path"):
            scan.heatmap_image.name = prediction["heatmap_path"]

        scan.save()

        output_serializer = ScanDetailSerializer(
            scan, context={"request": request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


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
