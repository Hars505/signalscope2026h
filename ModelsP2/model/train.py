import os
import sys
import argparse
import json
import yaml
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm

# Ensure ML root is on python path
ml_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from src.data.preprocess import SignalScopeDataset
from src.models.detector import SignalScopeDetector
from src.models.baseline import BaselineDetector
from src.utils.metrics import compute_metrics, save_metrics
from src.utils.calibration import TemperatureScaler


def evaluate_model(model, data_loader, device):
    model.eval()
    y_true = []
    y_prob = []
    with torch.no_grad():
        for batch in data_loader:
            pixel_values = batch['pixel_values'].to(device)
            fft_features = batch['fft_features'].to(device)
            labels = batch['label'].to(device)
            with torch.amp.autocast(
                device_type="cuda",
                dtype=torch.float16,
                enabled=(device.type == "cuda"),
            ):
                logits = model(pixel_values, fft_features)
                probs = torch.softmax(logits, dim=-1)[:, 1]
            y_true.extend(labels.cpu().numpy())
            y_prob.extend(probs.cpu().numpy())
    return compute_metrics(y_true, y_prob)


def train_model(model, train_loader, val_loader, config, device, model_name="SignalScopeDetector"):
    train_cfg = config.get('train', {})
    epochs = train_cfg.get('num_epochs', 3)
    lr = float(train_cfg.get('learning_rate', 2.0e-5))
    weight_decay = float(train_cfg.get('weight_decay', 0.01))
    accum_steps = train_cfg.get('gradient_accumulation_steps', 2)

    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    criterion = nn.CrossEntropyLoss()
    scaler = torch.amp.GradScaler(
        "cuda",
        enabled=(device.type == "cuda"),
    )

    print(f"\n==========================================")
    print(f"  Training {model_name} on {device}")
    print(f"  Epochs: {epochs} | LR: {lr} | Batch Size: {train_loader.batch_size} (Accum: {accum_steps})")
    print(f"  Mixed Precision FP16 Enabled")
    print(f"==========================================\n")

    best_auc = 0.0
    best_state = None

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        optimizer.zero_grad()

        pbar = tqdm(train_loader, desc=f"[{model_name}] Epoch {epoch}/{epochs}")
        for i, batch in enumerate(pbar):
            pixel_values = batch['pixel_values'].to(device)
            fft_features = batch['fft_features'].to(device)
            labels = batch['label'].to(device)

            with torch.amp.autocast(
                device_type="cuda",
                dtype=torch.float16,
                enabled=(device.type == "cuda"),
            ):
                logits = model(pixel_values, fft_features)
                loss = criterion(logits, labels) / accum_steps


            scaler.scale(loss).backward()

            if (i + 1) % accum_steps == 0 or (i + 1) == len(train_loader):
                scaler.step(optimizer)
                scaler.update()
                optimizer.zero_grad()

            total_loss += loss.item() * accum_steps * labels.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

            pbar.set_postfix({'loss': f"{loss.item()*accum_steps:.4f}", 'acc': f"{correct/total:.4f}"})

        epoch_loss = total_loss / total
        epoch_acc = correct / total

        # Validation evaluation after epoch
        model.eval()
        val_metrics = evaluate_model(model, val_loader, device)
        auc = val_metrics['roc_auc']
        f1 = val_metrics['macro_f1']
        acc = val_metrics['accuracy']

        print(f"[{model_name}] Epoch {epoch} -> Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.4f} | Val AUC: {auc:.4f} | Val F1: {f1:.4f} | Val Acc: {acc:.4f}")

        if auc >= best_auc:
            best_auc = auc
            best_state = {k: v.cpu() for k, v in model.state_dict().items()}

        torch.cuda.empty_cache()

    if best_state is not None:
        model.load_state_dict(best_state)

    return model, val_metrics


def run_full_training_pipeline(config_path):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training execution device: {device}")

    processed_dir = config['data']['processed_dir']
    train_csv = os.path.join(processed_dir, 'train.csv')
    test_csv = os.path.join(processed_dir, 'test.csv')

    if not os.path.exists(train_csv) or not os.path.exists(test_csv):
        print("Data splits not found. Running make_dataset builder first...")
        from src.data.make_dataset import build_splits
        build_splits(config_path)

    batch_size = config.get('train', {}).get('batch_size', 16)
    num_workers = config['data'].get('num_workers', 4)
    pin_memory = config['data'].get('pin_memory', device.type == 'cuda')
    image_size = config['data'].get('image_size', 224)

    train_ds = SignalScopeDataset(train_csv, image_size=image_size, is_train=True)
    val_csv = os.path.join(processed_dir, 'val.csv')
    if not os.path.exists(val_csv):
        raise FileNotFoundError("Validation split is required for training and calibration.")
    val_ds = SignalScopeDataset(val_csv, image_size=image_size, is_train=False)
    test_ds = SignalScopeDataset(test_csv, image_size=image_size, is_train=False)
    if len(val_ds) == 0:
        raise ValueError("Validation split is empty. Set data.val_split above 0 and rebuild the splits.")

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=num_workers > 0,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=num_workers > 0,
    )
    test_loader = DataLoader(
        test_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=num_workers > 0,
    )

    # 1. Train SignalScopeDetector (ViT + Frequency Branch)
    detector_model = SignalScopeDetector(
        backbone_name=config['model'].get('backbone', 'google/vit-base-patch16-224'),
        use_frequency_features=True,
        freq_embed_dim=config['model'].get('freq_embed_dim', 128),
        classifier_hidden=config['model'].get('classifier_hidden', 512),
        dropout=config['model'].get('dropout', 0.3)
    ).to(device)
    resume_path = config['model'].get('resume_model_path')
    if resume_path:
        if not os.path.isabs(resume_path):
            resume_path = os.path.join(ml_dir, resume_path)
        detector_model.load_state_dict(
            torch.load(resume_path, map_location=device), strict=False
        )
        print(f"Resumed detector weights from {resume_path}")

    trained_detector, detector_metrics = train_model(
        detector_model, train_loader, val_loader, config, device, model_name="SignalScopeDetector (ViT + FFT)"
    )

    # 2. Train BaselineDetector (Plain ViT)
    baseline_model = BaselineDetector(
        backbone_name=config['model'].get('backbone', 'google/vit-base-patch16-224'),
        classifier_hidden=config['model'].get('classifier_hidden', 512),
        dropout=config['model'].get('dropout', 0.3)
    ).to(device)
    baseline_resume_path = config['model'].get('resume_baseline_path')
    if baseline_resume_path:
        if not os.path.isabs(baseline_resume_path):
            baseline_resume_path = os.path.join(ml_dir, baseline_resume_path)
        baseline_model.load_state_dict(
            torch.load(baseline_resume_path, map_location=device), strict=False
        )
        print(f"Resumed baseline weights from {baseline_resume_path}")

    trained_baseline, baseline_metrics = train_model(
        baseline_model, train_loader, val_loader, config, device, model_name="BaselineDetector (Plain ViT)"
    )

    # Save Final Model Weights immediately after training
    save_dir = config['model'].get('final_model_path', 'models/trained/signalscope-final')
    if not os.path.isabs(save_dir):
        save_dir = os.path.join(ml_dir, save_dir)
    os.makedirs(save_dir, exist_ok=True)
    
    save_path = os.path.join(save_dir, 'pytorch_model.bin')
    torch.save(trained_detector.state_dict(), save_path)
    print(f"\nSaved trained SignalScopeDetector weights to {save_path}")

    baseline_save_dir = config['model'].get(
        'baseline_model_path',
        os.path.join(ml_dir, 'models/trained/baseline-final'),
    )
    if not os.path.isabs(baseline_save_dir):
        baseline_save_dir = os.path.join(ml_dir, baseline_save_dir)
    os.makedirs(baseline_save_dir, exist_ok=True)
    torch.save(trained_baseline.state_dict(), os.path.join(baseline_save_dir, 'pytorch_model.bin'))
    print(f"Saved trained BaselineDetector weights to {baseline_save_dir}/pytorch_model.bin")


    # Fit Temperature Calibration on Test Set for Detector
    scaler = TemperatureScaler()
    scaler.fit(trained_detector, val_loader, device=device)

    detector_test_metrics = evaluate_model(trained_detector, test_loader, device)
    baseline_test_metrics = evaluate_model(trained_baseline, test_loader, device)


    # 5. Save Final Report
    report = {
        "signalscope_detector": detector_test_metrics,
        "baseline_detector": baseline_test_metrics,
        "validation": {
            "signalscope_detector": detector_metrics,
            "baseline_detector": baseline_metrics
        },
        "temperature_scaling_factor": float(trained_detector.temperature.item())
    }
    save_metrics(report, os.path.join('report', 'metrics.json'))
    print("\nTraining completed successfully! Report saved to report/metrics.json.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/train_config.yaml')
    args = parser.parse_args()
    run_full_training_pipeline(args.config)
