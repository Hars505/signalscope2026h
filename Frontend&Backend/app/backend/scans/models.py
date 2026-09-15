from django.db import models
from django.contrib.auth.models import User


class Scan(models.Model):
    """One row per prediction — the core entity linking user uploads to ML verdicts."""

    LABEL_CHOICES = [
        ("real", "Real"),
        ("ai_generated", "AI-generated"),
        ("possibly_ai", "Possibly AI"),
    ]

    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE, related_name="scans"
    )
    image = models.ImageField(upload_to="scans/")
    thumbnail_image = models.ImageField(
        upload_to="thumbnails/", null=True, blank=True
    )  # B2-6: fast-loading preview for history list
    image_width = models.PositiveIntegerField(null=True, blank=True)   # B2-6
    image_height = models.PositiveIntegerField(null=True, blank=True)  # B2-6
    label = models.CharField(max_length=20, choices=LABEL_CHOICES)
    confidence = models.FloatField()
    threshold_used = models.FloatField()
    generator_attribution = models.CharField(
        max_length=50, null=True, blank=True
    )  # Module B
    explanation_text = models.JSONField(
        null=True, blank=True
    )  # list of cue strings, Module A
    model_scores = models.JSONField(
        null=True, blank=True
    )  # per-model probabilities returned by the inference ensemble
    provenance = models.JSONField(
        null=True, blank=True
    )  # EXIF/content-credentials evidence
    multimodal_result = models.JSONField(
        null=True, blank=True
    )  # optional image-caption consistency result
    adversarial_result = models.JSONField(
        null=True, blank=True
    )  # PGD attack and active-defence comparison
    heatmap_image = models.ImageField(
        upload_to="heatmaps/", null=True, blank=True
    )  # Module A
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Scan #{self.pk} — {self.label} ({self.confidence:.0%})"


class DegradationTest(models.Model):
    """Robustness self-test result per scan — Module C."""

    scan = models.ForeignKey(
        Scan, related_name="degradation_tests", on_delete=models.CASCADE
    )
    transform_type = models.CharField(max_length=30)  # jpeg_recompress, resize, screenshot
    confidence_after = models.FloatField()

    def __str__(self):
        return f"{self.transform_type} → {self.confidence_after:.0%}"
