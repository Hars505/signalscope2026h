import torch
import torch.nn as nn
from transformers import ViTModel, ViTConfig


class BaselineDetector(nn.Module):
    """
    Phase-1 Baseline Detector:
    Plain ViT model (no frequency branch, no calibration)
    """
    def __init__(
        self,
        backbone_name="google/vit-base-patch16-224",
        classifier_hidden=512,
        dropout=0.3,
        num_classes=2,
        freeze_vit=True
    ):
        super().__init__()
        try:
            self.vit = ViTModel.from_pretrained(backbone_name)
        except Exception:
            config = ViTConfig()
            self.vit = ViTModel(config)

        if freeze_vit:
            for param in self.vit.parameters():
                param.requires_grad = False

        vit_hidden_dim = self.vit.config.hidden_size


        self.classifier = nn.Sequential(
            nn.Linear(vit_hidden_dim, classifier_hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(classifier_hidden, num_classes)
        )

    def forward(self, pixel_values, fft_features=None):
        vit_outputs = self.vit(pixel_values=pixel_values)
        cls_embedding = vit_outputs.last_hidden_state[:, 0, :]
        logits = self.classifier(cls_embedding)
        return logits
