import os
import sys

# Ensure ML root is on python path
ml_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from model.predict_interface import SignalScopePredictor


app = FastAPI(
    title="SignalScope ML Serving API",
    description="Real vs AI-Generated Image Forensics Microservice with Explainability, Generator Attribution, and Active Defence",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy loading of predictor model instance
predictor = None


def get_predictor():
    global predictor
    if predictor is None:
        model_path = os.getenv("MODEL_PATH", os.path.join(ml_dir, "models/trained/signalscope-final"))
        predictor = SignalScopePredictor(model_path=model_path)
    return predictor


@app.on_event("startup")
async def startup_event():
    get_predictor()


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SignalScope ML API",
        "version": "2.0.0",
        "features": ["binary_detection", "grad_cam_explainability", "generator_attribution", "degradation_robustness", "active_defence"]
    }


@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    apply_defence: bool = Query(False, description="Apply active defence input filter")
):
    """
    Accepts an uploaded image file (JPEG/PNG/WEBP) and returns full forensic analysis:
    verdict, calibrated confidence, Grad-CAM heatmap, forensic cues, and generator attribution.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        pred = get_predictor()
        result = pred.predict_from_bytes(contents, include_explainability=True, apply_defence=apply_defence)
        
        # Omit raw PIL object from JSON API response
        if "explanation" in result and "overlay_pil" in result["explanation"]:
            del result["explanation"]["overlay_pil"]

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/explain")
async def explain_image(file: UploadFile = File(...)):
    """
    Returns Grad-CAM visual heatmap overlay and human-readable forensic cues.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        pred = get_predictor()
        result = pred.predict_from_bytes(contents, include_explainability=True)
        return {
            "verdict": result["label"],
            "confidence": result["confidence"],
            "explanation": {
                "heatmap_b64": result["explanation"].get("heatmap_b64", ""),
                "forensic_cues": result["explanation"].get("forensic_cues", [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainability error: {str(e)}")


@app.post("/attribute")
async def attribute_generator(file: UploadFile = File(...)):
    """
    Identifies the generator architecture family (GAN vs. Diffusion vs. Autoregressive vs. Real).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        pred = get_predictor()
        result = pred.predict_from_bytes(contents, include_explainability=False)
        return result.get("generator_attribution", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attribution error: {str(e)}")
