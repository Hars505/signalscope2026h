"""
SignalScope core-task predict interface.
Usage:
    from predict_interface import SignalScopePredictor
    predictor = SignalScopePredictor("best_model.pt", backbone="resnet50")
    result = predictor.predict("/path/to/image.jpg")
    # result = {"label": "ai_generated", "confidence": 0.88}
"""
import torch
import torch.nn as nn
from torchvision import transforms as T
from torchvision.models import resnet50, efficientnet_b0
from PIL import Image

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def _build_model(backbone_name, dropout=0.4):
    if backbone_name == "resnet50":
        model = resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(dropout), nn.Linear(in_features, 256), nn.ReLU(inplace=True),
            nn.Dropout(dropout / 2), nn.Linear(256, 1),
        )
    elif backbone_name == "efficientnet_b0":
        model = efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(nn.Dropout(dropout), nn.Linear(in_features, 1))
    else:
        raise ValueError(backbone_name)
    return model


class SignalScopePredictor:
    def __init__(self, weights_path, backbone="resnet50", image_size=224, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = _build_model(backbone).to(self.device)
        state = torch.load(weights_path, map_location=self.device)
        self.model.load_state_dict(state)
        self.model.eval()
        self.transform = T.Compose([
            T.Resize((image_size, image_size)),
            T.ToTensor(),
            T.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ])

    @torch.no_grad()
    def predict_from_pil(self, image, threshold=0.5):
        """Predict from an already decoded PIL image."""
        img = image.convert("RGB")
        x = self.transform(img).unsqueeze(0).to(self.device)
        logit = self.model(x).squeeze()
        prob_ai_generated = torch.sigmoid(logit).item()
        label = "ai_generated" if prob_ai_generated >= threshold else "real"
        # Present confidence as "how confident are we in the returned label" (0.5-1.0 range),
        # not raw P(ai_generated), to avoid a real-image confidently-scored-as-0.02 looking odd.
        confidence = prob_ai_generated if label == "ai_generated" else 1 - prob_ai_generated
        return {"label": label, "confidence": round(float(confidence), 4),
                 "raw_score_p_ai_generated": round(float(prob_ai_generated), 4)}

    def predict(self, image_path, threshold=0.5):
        img = Image.open(image_path)
        return self.predict_from_pil(img, threshold=threshold)
