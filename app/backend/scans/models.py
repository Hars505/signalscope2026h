from django.db import models
from django.contrib.auth.models import User


class Scan(models.Model):
    """One row per prediction — the core entity linking user uploads to ML verdicts."""

    LABEL_CHOICES = [
        ("real", "Real"),
        ("ai_generated", "AI-generated"),
    ]

    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE, related_name="scans"
    )
    image = models.ImageField(upload_to="scans/")
    label = models.CharField(max_length=20, choices=LABEL_CHOICES)
    confidence = models.FloatField()
    threshold_used = models.FloatField()
    generator_attribution = models.CharField(
        max_length=50, null=True, blank=True
    )  # Module B
    explanation_text = models.JSONField(
        null=True, blank=True
    )  # list of cue strings, Module A
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
