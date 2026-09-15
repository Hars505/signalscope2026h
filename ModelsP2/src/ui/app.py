import os
import sys
import io
import gradio as gr
import torch
from PIL import Image
import numpy as np

# Ensure ML root directory is on python path
ml_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from model.predict_interface import SignalScopePredictor
from src.data.preprocess import compute_fft_spectrum
from src.utils.degradation_benchmark import apply_jpeg_compression, apply_resizing
from src.defence.adversarial import AdversarialEvaluator

# Initialize predictor
predictor = SignalScopePredictor(model_path=os.path.join(ml_dir, "models/trained/signalscope-final"))


def analyze_image(input_image, apply_defence=False):
    """
    Core analysis handler for Tab 1 & Tab 2 (Verdict, Grad-CAM Heatmap, Forensic Cues, Attribution).
    """
    if input_image is None:
        return (
            "### Please upload an image.",
            None,
            "No cues available.",
            "No attribution available."
        )

    image_pil = Image.fromarray(input_image)
    res = predictor.predict_from_pil(image_pil, include_explainability=True, apply_defence=apply_defence)

    # Formatted Verdict Badge
    label = res["label"].upper().replace("_", " ")
    conf = res["confidence"] * 100
    real_p = res["probabilities"]["real"] * 100
    fake_p = res["probabilities"]["ai_generated"] * 100

    if res["label"] == "ai_generated":
        verdict_md = f"""
        <div style="background-color: #3d1414; padding: 20px; border-radius: 10px; border: 2px solid #ef4444; color: white;">
            <h2 style="color: #ef4444; margin-0;">⚠️ Verdict: LIKELY {label}</h2>
            <h3 style="margin-top: 5px;">Calibrated Confidence: <b>{conf:.1f}%</b></h3>
            <p>Class Probabilities: Real: {real_p:.1f}% | AI-Generated: {fake_p:.1f}%</p>
            <p><i>Note: Outputs are probabilistic likelihood assessments, not absolute claims.</i></p>
        </div>
        """
    else:
        verdict_md = f"""
        <div style="background-color: #143d22; padding: 20px; border-radius: 10px; border: 2px solid #22c55e; color: white;">
            <h2 style="color: #22c55e; margin-0;">✅ Verdict: LIKELY {label}</h2>
            <h3 style="margin-top: 5px;">Calibrated Confidence: <b>{conf:.1f}%</b></h3>
            <p>Class Probabilities: Real: {real_p:.1f}% | AI-Generated: {fake_p:.1f}%</p>
            <p><i>Note: Outputs are probabilistic likelihood assessments, not absolute claims.</i></p>
        </div>
        """

    # Grad-CAM Heatmap Overlay
    overlay_pil = res["explanation"].get("overlay_pil", input_image)

    # Forensic Cues List
    cues = res["explanation"].get("forensic_cues", [])
    cues_md = "### 🔍 Faithful Forensic Cues:\n"
    for idx, cue in enumerate(cues, 1):
        sev_color = "#ef4444" if cue.get("severity") == "high" else "#f59e0b" if cue.get("severity") == "medium" else "#3b82f6"
        cues_md += f"""
        **{idx}. [{cue['category']}] {cue['title']}**
        - <span style="color:{sev_color}; font-weight:bold;">[{cue.get('severity','info').upper()}]</span> {cue['description']}
        """

    # Generator Attribution
    attr = res.get("generator_attribution", {})
    attr_family = attr.get("family", "Unknown")
    attr_conf = attr.get("confidence", 0.0) * 100
    attr_probs = attr.get("family_probabilities", {})

    attr_md = f"""
    ### 🧬 Generator Architecture Family: **{attr_family}** (Confidence: {attr_conf:.1f}%)
    **Distribution Breakdown:**
    - **Diffusion (SD / Midjourney / DALL-E / FLUX):** {attr_probs.get('Diffusion', 0.0)*100:.1f}%
    - **GAN (StyleGAN / ProGAN):** {attr_probs.get('GAN', 0.0)*100:.1f}%
    - **Autoregressive (Imagen / Parti):** {attr_probs.get('Autoregressive', 0.0)*100:.1f}%
    - **Real Optical Capture:** {attr_probs.get('Real', 0.0)*100:.1f}%
    """

    return verdict_md, overlay_pil, cues_md, attr_md


def simulate_degradation(input_image, jpeg_qf, scale_factor):
    """
    Simulator for Tab 3 (Robustness to Degradation).
    """
    if input_image is None:
        return None, "Upload an image first."

    image_pil = Image.fromarray(input_image)
    degraded = apply_jpeg_compression(image_pil, quality=jpeg_qf)
    degraded = apply_resizing(degraded, scale=scale_factor)

    res = predictor.predict_from_pil(degraded, include_explainability=False)

    report_md = f"""
    ### 📉 Degradation Impact Analysis:
    - **Applied JPEG Quality:** {jpeg_qf} / 100
    - **Applied Resizing Scale:** {scale_factor:.2f}x
    - **Post-Degradation Verdict:** `{res['label'].upper()}`
    - **Post-Degradation Calibrated Confidence:** `{res['confidence']*100:.1f}%`
    - **Accuracy Retention Status:** {'✅ MAINTAINED' if res['confidence'] > 0.6 else '⚠️ DEGRADED'}
    """

    return np.array(degraded), report_md


def simulate_adversarial_attack(input_image, attack_epsilon, enable_defence):
    """
    Simulator for Tab 4 (Active Defence & Adversarial Vulnerability Analysis).
    """
    if input_image is None:
        return None, "Upload an image first."

    image_pil = Image.fromarray(input_image).convert("RGB")
    clean_result = predictor.predict_from_pil(image_pil, include_explainability=False)

    resized_image = predictor.resize(image_pil)
    pixel_values = predictor.img_transform(image_pil).unsqueeze(0).to(predictor.device)
    fft_features = compute_fft_spectrum(resized_image).unsqueeze(0).to(predictor.device)
    predicted_label = 1 if clean_result["label"] == "ai_generated" else 0

    attacker = AdversarialEvaluator(predictor.model, device=predictor.device)
    attacked_pixels = attacker.generate_pgd_attack(
        pixel_values,
        fft_features,
        target_label=predicted_label,
        epsilon=float(attack_epsilon),
        alpha=min(float(attack_epsilon) / 4.0, 0.007),
        num_steps=5,
    )

    mean = torch.tensor([0.485, 0.456, 0.406], device=predictor.device).view(1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225], device=predictor.device).view(1, 3, 1, 1)
    attacked_array = ((attacked_pixels * std + mean).clamp(0, 1)[0].permute(1, 2, 0).cpu().numpy() * 255).astype(np.uint8)
    attacked_image = Image.fromarray(attacked_array)
    attacked_result = predictor.predict_from_pil(attacked_image, include_explainability=False)

    defended_result = None
    if enable_defence:
        defended_result = predictor.predict_from_pil(
            attacked_image, include_explainability=False, apply_defence=True
        )

    status_str = "ACTIVE DEFENCE PRE-FILTER APPLIED" if enable_defence else "UNPROTECTED INPUT"
    defended_line = ""
    if defended_result is not None:
        defended_line = f"""
    - **Defended verdict:** `{defended_result['label'].upper()}` ({defended_result['confidence']*100:.1f}%)
    """
    
    analysis_md = rf"""
    ### ⚔️ Adversarial Vulnerability & Active Defence Report:
    - **Simulated Perturbation Level ($\epsilon$):** `{attack_epsilon:.3f}`
    - **Protection Status:** **{status_str}**
    - **Clean verdict:** `{clean_result['label'].upper()}` ({clean_result['confidence']*100:.1f}%)
    - **Attacked verdict:** `{attacked_result['label'].upper()}` ({attacked_result['confidence']*100:.1f}%)
    {defended_line}
    - **Defence Strategy:** Multi-stage median noise suppression + JPEG pre-filtering.
    """

    return np.array(attacked_image), analysis_md


# Build Gradio Blocks UI
with gr.Blocks(title="SignalScope - AI Media Forensics") as demo:

    gr.Markdown(
        """
        # 🔬 SignalScope: AI vs. Real Image Media Forensics System
        ### *SIH-2026 Internal Hackathon | Problem Statement 2 (Advanced)*
        **Key Focus:** Generalization to Unseen Generators | Calibrated Confidence | Grad-CAM Heatmaps | Forensic Cues | Generator Attribution | Active Defence
        """
    )

    with gr.Tabs():
        # TAB 1: Real vs AI Detection & Faithful Explainability (Bonus A)
        with gr.TabItem("🔍 Real vs. AI Detection & Visual Heatmap (Bonus A)"):
            with gr.Row():
                with gr.Column(scale=1):
                    input_img = gr.Image(type="numpy", label="Upload Image for Forensics")
                    defence_chk = gr.Checkbox(label="Enable Active Defence Input Filter", value=False)
                    btn_analyze = gr.Button("🚀 Run SignalScope Analysis", variant="primary")
                with gr.Column(scale=1):
                    verdict_output = gr.Markdown("### Upload an image and click Run Analysis.")
                    heatmap_output = gr.Image(label="Grad-CAM Visual Heatmap Overlay")

            with gr.Row():
                with gr.Column(scale=1):
                    cues_output = gr.Markdown("### 🔍 Faithful Forensic Cues will appear here.")
                with gr.Column(scale=1):
                    attribution_output = gr.Markdown("### 🧬 Generator Attribution will appear here.")

            btn_analyze.click(
                fn=analyze_image,
                inputs=[input_img, defence_chk],
                outputs=[verdict_output, heatmap_output, cues_output, attribution_output]
            )

        # TAB 2: Generator Attribution Deep-Dive (Bonus B)
        with gr.TabItem("🧬 Generator Family Attribution (Bonus B)"):
            gr.Markdown("### Identify Synthetic Architecture Family (GAN vs. Diffusion vs. Autoregressive)")
            with gr.Row():
                with gr.Column():
                    attr_input_img = gr.Image(type="numpy", label="Select Image")
                    attr_btn = gr.Button("Inspect Generator Family", variant="secondary")
                with gr.Column():
                    attr_detail_output = gr.Markdown("### Select image to inspect generator attribution.")

            attr_btn.click(
                fn=lambda img: analyze_image(img)[3],
                inputs=[attr_input_img],
                outputs=[attr_detail_output]
            )

        # TAB 3: Robustness to Degradation Simulator (Bonus C)
        with gr.TabItem("📉 Degradation Simulator (Bonus C)"):
            gr.Markdown("### Benchmark Model Robustness Under JPEG Compression & Resizing")
            with gr.Row():
                with gr.Column():
                    deg_input_img = gr.Image(type="numpy", label="Source Image")
                    jpeg_slider = gr.Slider(minimum=10, maximum=100, value=50, step=5, label="JPEG Quality Factor (QF)")
                    scale_slider = gr.Slider(minimum=0.25, maximum=1.0, value=0.50, step=0.05, label="Resizing Scale Factor")
                    deg_btn = gr.Button("Simulate Degradation", variant="primary")
                with gr.Column():
                    deg_img_output = gr.Image(label="Degraded Output Preview")
                    deg_report_output = gr.Markdown("### Run simulation to test robustness.")

            deg_btn.click(
                fn=simulate_degradation,
                inputs=[deg_input_img, jpeg_slider, scale_slider],
                outputs=[deg_img_output, deg_report_output]
            )

        # TAB 4: Active Defence & Adversarial Analysis (Bonus F/G)
        with gr.TabItem("🛡️ Active Defence & Adversarial Vulnerability (Bonus F/G)"):
            gr.Markdown("### Adversarial Attack Noise Simulation & Active Input Filtering")
            with gr.Row():
                with gr.Column():
                    adv_input_img = gr.Image(type="numpy", label="Input Image")
                    eps_slider = gr.Slider(minimum=0.005, maximum=0.05, value=0.03, step=0.005, label="Adversarial Noise Perturbation (ε)")
                    adv_defence_chk = gr.Checkbox(label="Activate Defensive Input Filter", value=True)
                    adv_btn = gr.Button("Run Adversarial Defence Test", variant="primary")
                with gr.Column():
                    adv_img_output = gr.Image(label="Processed Image")
                    adv_report_output = gr.Markdown("### Run test to evaluate adversarial robustness.")

            adv_btn.click(
                fn=simulate_adversarial_attack,
                inputs=[adv_input_img, eps_slider, adv_defence_chk],
                outputs=[adv_img_output, adv_report_output]
            )

    gr.Markdown(
        """
        ---
        **SignalScope Security & Ethics:** Strict compliance with SIH-2026 guidelines. All predictions represent calibrated statistical likelihoods.
        """
    )


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
