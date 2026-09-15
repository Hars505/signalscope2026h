import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import ViTModel, ViTConfig


class FrequencyBranch(nn.Module):
    """
    3-layer CNN over 1-channel log-magnitude FFT spectrum (224x224) -> 128-d embedding.
    """
    def __init__(self, embed_dim=128):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),  # 112x112

            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),  # 56x56

            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1))  # 1x1
        )
        self.fc = nn.Linear(128, embed_dim)

    def forward(self, x):
        features = self.conv(x)
        features = features.view(features.size(0), -1)
        embedding = self.fc(features)
        return embedding


class SignalScopeDetector(nn.Module):
    """
    SignalScope Core Detector Architecture:
    - ViT Backbone (768-d CLS embedding)
    - FFT Frequency Branch (128-d embedding)
    - Fusion MLP (896 -> 512 -> 2)
    - Learned Temperature Scalar for Calibration
    """
    def __init__(
        self,
        backbone_name="google/vit-base-patch16-224",
        use_frequency_features=True,
        freq_embed_dim=128,
        classifier_hidden=512,
        dropout=0.3,
        num_classes=2,
        freeze_vit=True
    ):
        super().__init__()
        self.use_frequency_features = use_frequency_features
        self.num_classes = num_classes

        # ViT Backbone
        try:
            self.vit = ViTModel.from_pretrained(backbone_name)
        except Exception:
            # Fallback to default ViTConfig if offline/no download
            config = ViTConfig()
            self.vit = ViTModel(config)

        # Freeze ViT backbone parameters so only layers on top are trained
        if freeze_vit:
            for param in self.vit.parameters():
                param.requires_grad = False

        vit_hidden_dim = self.vit.config.hidden_size  # 768

        # Frequency Branch
        if self.use_frequency_features:
            self.freq_branch = FrequencyBranch(embed_dim=freq_embed_dim)
            fusion_dim = vit_hidden_dim + freq_embed_dim
        else:
            self.freq_branch = None
            fusion_dim = vit_hidden_dim

        # Classifier Head
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, classifier_hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(classifier_hidden, num_classes)
        )

        # Temperature scaling scalar (initialized at 1.0)
        self.temperature = nn.Parameter(torch.ones(1), requires_grad=False)

    def forward(self, pixel_values, fft_features=None):
        # Extract ViT CLS embedding
        vit_outputs = self.vit(pixel_values=pixel_values)
        cls_embedding = vit_outputs.last_hidden_state[:, 0, :]  # [B, 768]

        if self.use_frequency_features and fft_features is not None:
            freq_embedding = self.freq_branch(fft_features)  # [B, 128]
            fused = torch.cat([cls_embedding, freq_embedding], dim=1)  # [B, 896]
        else:
            fused = cls_embedding

        logits = self.classifier(fused)
        return logits

    def predict_probabilities(self, pixel_values, fft_features=None):
        """
        Returns calibrated class probabilities: softmax(logits / temperature)
        """
        logits = self.forward(pixel_values, fft_features)
        calibrated_logits = logits / self.temperature
        probs = F.softmax(calibrated_logits, dim=-1)
        return probs
