import os
import io
import sys
from PIL import Image

# Ensure ML root is on python path
ml_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

import torch
import torch.nn.functional as F
from torchvision import transforms

from src.models.detector import SignalScopeDetector
from src.models.explainability import GradCAMExplainer, ForensicCueSynthesizer
from src.models.attribution import GeneratorAttributor
from src.defence.adversarial import ActiveDefenceFilter
from src.data.preprocess import compute_fft_spectrum


class SignalScopePredictor:
    """
    Unified SignalScope Predictor Interface (Mandatory Core + Bonus A, B, C, F, G).
    Single-call inference contract supplying verdict, calibrated confidence,
    Grad-CAM visual heatmap, human-readable forensic cues, generator attribution, and active defense.
    """
    def __init__(self, model_path="models/trained/signalscope-final", device=None, attribution_path=None):
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self.model = SignalScopeDetector()
        
        # Load weights if trained model checkpoint exists
        bin_path = os.path.join(model_path, "pytorch_model.bin")
        if os.path.exists(bin_path):
            state_dict = torch.load(bin_path, map_location=self.device)
            self.model.load_state_dict(state_dict, strict=False)
            print(f"Loaded trained weights from {bin_path}")
        elif os.path.exists(model_path) and os.path.isfile(model_path):
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict, strict=False)
            print(f"Loaded trained weights from {model_path}")
        else:
            print(f"Notice: Running with initialized SignalScopeDetector model on {self.device}.")

        self.model.to(self.device)
        self.model.eval()

        # Bonus Modules Initialization
        self.explainer = GradCAMExplainer(self.model, device=self.device)
        self.cue_synthesizer = ForensicCueSynthesizer()
        self.attributor = None
        if attribution_path is not None and os.path.exists(attribution_path):
            self.attributor = GeneratorAttributor().to(self.device)
            attribution_state = torch.load(attribution_path, map_location=self.device)
            self.attributor.load_state_dict(attribution_state)
        self.defence_filter = ActiveDefenceFilter()

        self.img_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])
        self.resize = transforms.Resize((224, 224))

    def predict_from_pil(self, image_pil, include_explainability=True, apply_defence=False):
        """
        Runs complete inference pipeline on a PIL image object.
        """
        defence_applied = False
        if apply_defence:
            image_pil = self.defence_filter.sanitize_pil_image(image_pil)
            defence_applied = True

        image_rgb = image_pil.convert('RGB')
        pixel_values = self.img_transform(image_rgb).unsqueeze(0).to(self.device)

        resized_img = self.resize(image_rgb)
        fft_features = compute_fft_spectrum(resized_img).unsqueeze(0).to(self.device)

        # Forward pass for binary detection
        with torch.no_grad():
            vit_outputs = self.model.vit(pixel_values=pixel_values)
            cls_embedding = vit_outputs.last_hidden_state[:, 0, :]
            
            if self.model.use_frequency_features and self.model.freq_branch is not None:
                freq_embedding = self.model.freq_branch(fft_features)
                fused_embedding = torch.cat([cls_embedding, freq_embedding], dim=1)
            else:
                fused_embedding = cls_embedding

            logits = self.model.classifier(fused_embedding)
            calibrated_logits = logits / getattr(self.model, 'temperature', 1.0)
            probs = F.softmax(calibrated_logits, dim=-1).squeeze(0).cpu().numpy()

        real_prob = float(probs[0])
        fake_prob = float(probs[1])

        if fake_prob >= 0.5:
            label = "ai_generated"
            confidence = round(fake_prob, 4)
        else:
            label = "real"
            confidence = round(real_prob, 4)

        # Bonus B: Generator Family Attribution
        if self.attributor is None:
            attribution_result = {
                "status": "unavailable",
                "reason": "No trained generator-attribution checkpoint was supplied."
            }
        else:
            attribution_result = self.attributor.predict_attribution(fused_embedding)

        # Bonus A: Explainability (Grad-CAM Heatmap + Forensic Cues)
        explanation = {}
        if include_explainability:
            try:
                heatmap_224 = self.explainer.generate_heatmap(pixel_values, fft_features, target_class=1 if fake_prob >= 0.5 else 0)
                overlay_pil, heatmap_b64 = self.explainer.overlay_heatmap(image_rgb, heatmap_224)
                cues = self.cue_synthesizer.synthesize_cues(image_rgb, heatmap_224, fft_features_tensor=fft_features, confidence=confidence)

                explanation = {
                    "heatmap_b64": heatmap_b64,
                    "forensic_cues": cues,
                    "overlay_pil": overlay_pil
                }
            except Exception as e:
                explanation = {
                    "error": f"Explainability extraction error: {str(e)}",
                    "forensic_cues": []
                }

        return {
            "label": label,
            "confidence": confidence,
            "calibrated": True,
            "probabilities": {
                "real": round(real_prob, 4),
                "ai_generated": round(fake_prob, 4)
            },
            "generator_attribution": attribution_result,
            "explanation": explanation,
            "active_defence": {
                "defence_applied": defence_applied,
                "status": "Sanitized via Multi-stage Filter" if defence_applied else "Standard Processing"
            }
        }

    def predict_from_path(self, image_path, include_explainability=True, apply_defence=False):
        """
        Predict from image file path.
        """
        image = Image.open(image_path)
        return self.predict_from_pil(image, include_explainability=include_explainability, apply_defence=apply_defence)

    def predict_from_bytes(self, image_bytes, include_explainability=True, apply_defence=False):
        """
        Predict from raw image bytes.
        """
        image = Image.open(io.BytesIO(image_bytes))
        return self.predict_from_pil(image, include_explainability=include_explainability, apply_defence=apply_defence)
