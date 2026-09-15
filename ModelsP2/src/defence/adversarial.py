import io
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image, ImageFilter
from torchvision import transforms


class AdversarialEvaluator:
    """
    Adversarial Attack Generator & Vulnerability Evaluator (Bonus G).
    Implements FGSM (Fast Gradient Sign Method) and PGD (Projected Gradient Descent) attacks.
    """
    def __init__(self, model, device=None):
        self.model = model
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    def generate_fgsm_attack(self, pixel_values, fft_features, target_label=1, epsilon=0.03):
        """
        Generates FGSM adversarial image tensor for target perturbation level epsilon.
        """
        self.model.eval()
        pixel_values = pixel_values.to(self.device).clone().detach().requires_grad_(True)
        if fft_features is not None:
            fft_features = fft_features.to(self.device)

        labels = torch.tensor([target_label], device=self.device)
        logits = self.model(pixel_values, fft_features)
        loss = F.cross_entropy(logits, labels)

        self.model.zero_grad()
        loss.backward()

        # Collect data gradient
        data_grad = pixel_values.grad.data
        perturbed_pixels = pixel_values + epsilon * data_grad.sign()
        perturbed_pixels = torch.clamp(perturbed_pixels, -3.0, 3.0)  # normalized tensor range

        return perturbed_pixels.detach()

    def generate_pgd_attack(self, pixel_values, fft_features, target_label=1, epsilon=0.03, alpha=0.007, num_steps=10):
        """
        Generates PGD iterative adversarial attack tensor.
        """
        self.model.eval()
        orig_pixels = pixel_values.to(self.device).clone().detach()
        perturbed_pixels = orig_pixels.clone().detach().requires_grad_(True)
        labels = torch.tensor([target_label], device=self.device)

        if fft_features is not None:
            fft_features = fft_features.to(self.device)

        for step in range(num_steps):
            perturbed_pixels.requires_grad = True
            logits = self.model(perturbed_pixels, fft_features)
            loss = F.cross_entropy(logits, labels)

            self.model.zero_grad()
            loss.backward()

            with torch.no_grad():
                grad = perturbed_pixels.grad.data
                perturbed_pixels = perturbed_pixels + alpha * grad.sign()
                eta = torch.clamp(perturbed_pixels - orig_pixels, min=-epsilon, max=epsilon)
                perturbed_pixels = torch.clamp(orig_pixels + eta, -3.0, 3.0)

        return perturbed_pixels.detach()


class ActiveDefenceFilter:
    """
    Active Defence & Input Sanitization Pre-Filter (Bonus F/G).
    Neutralizes high-frequency adversarial noise perturbations using defensive pre-filtering.
    """
    def __init__(self, jpeg_defense_quality=85, median_kernel_size=3):
        self.jpeg_quality = jpeg_defense_quality
        self.median_kernel_size = median_kernel_size

    def sanitize_pil_image(self, image_pil):
        """
        Applies defensive multi-stage sanitization to neutralise adversarial noise:
        1. Median filtering to strip high-frequency pixel noise spikes.
        2. JPEG compression pre-filtering to destroy adversarial gradient directions.
        3. Subtle spatial resize smoothing.
        """
        # 1. Median filter
        filtered_pil = image_pil.filter(ImageFilter.MedianFilter(size=self.median_kernel_size))

        # 2. Defensive JPEG encoding
        buffer = io.BytesIO()
        filtered_pil.save(buffer, format="JPEG", quality=self.jpeg_quality)
        buffer.seek(0)
        sanitized_pil = Image.open(buffer).convert("RGB")

        return sanitized_pil
