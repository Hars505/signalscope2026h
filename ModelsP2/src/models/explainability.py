import os
import io
import base64
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import cv2


class GradCAMExplainer:
    """
    Grad-CAM Explainer for SignalScopeDetector (ViT + FFT frequency branch).
    Extracts spatial activation gradients from ViT transformer patch tokens (14x14 grid)
    and maps them back to the 224x224 image space.
    """
    def __init__(self, model, device=None):
        self.model = model
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    def generate_heatmap(self, pixel_values, fft_features=None, target_class=1):
        """
        Generates a 224x224 normalized Grad-CAM heatmap array for target_class (1 = AI-generated).
        """
        self.model.eval()
        
        # We need gradients for the ViT backbone outputs
        pixel_values = pixel_values.to(self.device).detach().requires_grad_(True)
        if fft_features is not None:
            fft_features = fft_features.to(self.device)

        # Forward pass on ViT backbone directly to catch hidden states with gradients enabled
        vit_outputs = self.model.vit(pixel_values=pixel_values, output_hidden_states=True)
        last_hidden_state = vit_outputs.last_hidden_state  # [1, 197, 768]
        last_hidden_state.retain_grad()

        cls_embedding = last_hidden_state[:, 0, :]  # [1, 768]
        
        if self.model.use_frequency_features and self.model.freq_branch is not None and fft_features is not None:
            freq_embedding = self.model.freq_branch(fft_features)  # [1, 128]
            fused = torch.cat([cls_embedding, freq_embedding], dim=1)
        else:
            fused = cls_embedding

        logits = self.model.classifier(fused)
        score = logits[0, target_class]

        self.model.zero_grad()
        score.backward()

        # Extract gradients and activations for patch tokens (tokens 1..196)
        grads = last_hidden_state.grad[:, 1:, :]       # [1, 196, 768]
        activations = last_hidden_state[:, 1:, :]      # [1, 196, 768]

        # Compute importance weights alpha_k via mean gradient per token feature
        weights = torch.mean(grads, dim=1, keepdim=True)  # [1, 1, 768]
        cam = torch.sum(weights * activations, dim=-1)     # [1, 196]
        cam = F.relu(cam).squeeze(0).detach().cpu().numpy()  # [196]

        # Reshape 196 patch tokens into 14x14 grid
        cam_grid = cam.reshape(14, 14)

        # Normalize cam_grid to [0, 1]
        if cam_grid.max() > cam_grid.min():
            cam_grid = (cam_grid - cam_grid.min()) / (cam_grid.max() - cam_grid.min() + 1e-8)
        else:
            cam_grid = np.zeros((14, 14), dtype=np.float32)

        # Resize 14x14 spatial CAM grid up to 224x224 image resolution
        heatmap_224 = cv2.resize(cam_grid, (224, 224), interpolation=cv2.INTER_CUBIC)
        heatmap_224 = np.clip(heatmap_224, 0.0, 1.0)

        return heatmap_224

    def overlay_heatmap(self, image_pil, heatmap_224, alpha=0.5):
        """
        Overlays the 224x224 Grad-CAM heatmap onto a PIL RGB image.
        Returns:
            overlay_pil: PIL Image object with blended JET colormap heatmap
            heatmap_b64: Base64 string for web API / UI display
        """
        img_np = np.array(image_pil.convert("RGB").resize((224, 224)))

        # Convert normalized float heatmap to 8-bit uint8 for OpenCV colormap
        heatmap_uint8 = np.uint8(255 * heatmap_224)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Blend image and colored heatmap
        blended = cv2.addWeighted(img_np, 1 - alpha, heatmap_colored, alpha, 0)
        overlay_pil = Image.fromarray(blended)

        # Convert to Base64 PNG string
        buffered = io.BytesIO()
        overlay_pil.save(buffered, format="PNG")
        heatmap_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return overlay_pil, heatmap_b64


class ForensicCueSynthesizer:
    """
    Synthesizes human-readable forensic cues explaining synthetic anomalies in an image.
    Combines spectral frequency metrics, spatial Grad-CAM activation patterns, and texture analysis.
    """
    def __init__(self):
        pass

    def synthesize_cues(self, image_pil, heatmap_224, fft_features_tensor=None, confidence=0.5):
        """
        Analyzes image properties & Grad-CAM heatmap to generate grounded forensic cues.
        Returns a list of human-readable cue dictionaries.
        """
        cues = []
        img_np = np.array(image_pil.convert("RGB").resize((224, 224)))
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        # 1. Spectral Anomaly Analysis (FFT grid patterns & high-frequency energy ratio)
        if fft_features_tensor is not None:
            fft_np = fft_features_tensor.squeeze().cpu().numpy()
            fft_mean = float(np.mean(fft_np))
            fft_std = float(np.std(fft_np))
            fft_max = float(np.max(fft_np))
            
            # High spectral variance / peak ratio signals periodic GAN or Diffusion upsampling grid artifacts
            if fft_max > 2.5 * (fft_mean + fft_std):
                cues.append({
                    "category": "Frequency Domain",
                    "title": "Periodic Spectral Grid Artifacts",
                    "description": f"High-frequency peak anomaly (spectral ratio {fft_max/fft_mean:.2f}x) characteristic of generative upsampling filters.",
                    "severity": "high" if confidence > 0.8 else "medium"
                })
            else:
                cues.append({
                    "category": "Frequency Domain",
                    "title": "Natural Spectrum Continuum",
                    "description": "Log-magnitude FFT spectrum exhibits continuous smooth energy decay typical of optical camera sensors.",
                    "severity": "low"
                })

        # 2. Localized Spatial Heatmap Activation & Focal Analysis
        focal_mask = (heatmap_224 > 0.6)
        focal_ratio = float(np.sum(focal_mask) / (224 * 224))

        if focal_ratio > 0.05 and focal_ratio < 0.35:
            cues.append({
                "category": "Local Anomaly",
                "title": "Focalized Structural Deformation",
                "description": f"High-confidence synthetic anomaly concentrated in localized region ({focal_ratio*100:.1f}% of image frame), highlighting warped geometry or unnatural texture patch.",
                "severity": "high"
            })
        elif focal_ratio >= 0.35:
            cues.append({
                "category": "Global Pattern",
                "title": "Diffuse Synthetic Texture Pattern",
                "description": "Widespread high activation across image frame indicates global diffusion noise inconsistency or broad rendering artifacts.",
                "severity": "medium"
            })

        # 3. Local Texture & Edge Gradient Variance Analysis
        # Compute Laplacian gradient variance (sharpness vs over-smoothing)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        if focal_mask.any():
            focal_pixels = gray[focal_mask]
            focal_std = float(np.std(focal_pixels))
            bg_pixels = gray[~focal_mask] if (~focal_mask).any() else gray
            bg_std = float(np.std(bg_pixels))

            if focal_std < 0.6 * bg_std:
                cues.append({
                    "category": "Texture Consistency",
                    "title": "Unnatural Surface Over-Smoothing",
                    "description": f"Activated region shows abnormal micro-texture smoothing (variance ratio {focal_std/(bg_std+1e-5):.2f}) common in neural rendering.",
                    "severity": "high"
                })

        if laplacian_var < 80.0 and confidence > 0.5:
            cues.append({
                "category": "Optical Boundary",
                "title": "Lighting & Edge Gradient Softening",
                "description": f"Image edge contrast variance is lower than optical baseline ({laplacian_var:.1f}), consistent with synthetic blending.",
                "severity": "medium"
            })

        if not cues:
            cues.append({
                "category": "General Forensics",
                "title": "Authentic Optical Consistency",
                "description": "No prominent synthetic artifacts, spectral grid spikes, or unnatural surface smoothing detected.",
                "severity": "info"
            })

        return cues
