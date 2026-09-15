import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np


class GeneratorAttributor(nn.Module):
    """
    Multi-class Generator Family Attribution Classifier (Bonus B).
    Classifies input image representations into generator families:
    0: Real (authentic optical capture)
    1: GAN (ProGAN, StyleGAN, StarGAN)
    2: Diffusion (Stable Diffusion, Midjourney, DALL-E, FLUX)
    3: Autoregressive (Imagen, Parti)
    """
    FAMILIES = {
        0: "Real",
        1: "GAN",
        2: "Diffusion",
        3: "Autoregressive"
    }

    def __init__(self, embed_dim=896, hidden_dim=256, dropout=0.2, num_families=4):
        super().__init__()
        self.head = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, num_families)
        )

    def forward(self, embedding):
        logits = self.head(embedding)
        return logits

    def predict_attribution(self, embedding):
        """
        Given fused embedding [B, 896], returns predicted family name, confidence, and family probabilities.
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(embedding)
            probs = F.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

        pred_idx = int(np.argmax(probs))
        pred_family = self.FAMILIES.get(pred_idx, "Unknown")
        pred_conf = float(probs[pred_idx])

        family_probs = {
            self.FAMILIES[i]: round(float(probs[i]), 4)
            for i in range(len(self.FAMILIES))
        }

        return {
            "family": pred_family,
            "confidence": round(pred_conf, 4),
            "family_probabilities": family_probs
        }
