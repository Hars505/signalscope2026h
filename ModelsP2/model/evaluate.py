import os
import sys
import argparse

# Ensure ML root is on python path
ml_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

import yaml
import torch
import pandas as pd
from tqdm import tqdm


from src.data.preprocess import SignalScopeDataset, get_dataloaders
from src.models.detector import SignalScopeDetector
from src.models.baseline import BaselineDetector
from src.utils.metrics import compute_metrics, compute_unseen_metrics, save_metrics


def evaluate_checkpoint(model_path, config_path, model_type="signalscope"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load model architecture
    if model_type == "baseline":
        model = BaselineDetector(
            backbone_name=config['model'].get('backbone', 'google/vit-base-patch16-224'),
            classifier_hidden=config['model'].get('classifier_hidden', 512),
            dropout=config['model'].get('dropout', 0.3)
        )
    else:
        model = SignalScopeDetector(
            backbone_name=config['model'].get('backbone', 'google/vit-base-patch16-224'),
            use_frequency_features=config['model'].get('use_frequency_features', True),
            freq_embed_dim=config['model'].get('freq_embed_dim', 128),
            classifier_hidden=config['model'].get('classifier_hidden', 512),
            dropout=config['model'].get('dropout', 0.3)
        )

    if not os.path.isabs(model_path):
        model_path = os.path.join(ml_dir, model_path)

    bin_path = os.path.join(model_path, "pytorch_model.bin")
    if os.path.exists(bin_path):
        state_dict = torch.load(bin_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"Loaded trained checkpoint from {bin_path}")
    elif os.path.exists(model_path) and os.path.isfile(model_path):
        state_dict = torch.load(model_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"Loaded trained checkpoint from {model_path}")
    else:
        raise FileNotFoundError(f"CRITICAL: Model checkpoint file not found at {bin_path}. Please run train.py first.")


    model.to(device)
    model.eval()

    # Load test dataset
    processed_dir = config['data']['processed_dir']
    test_csv = os.path.join(processed_dir, 'test.csv')

    if not os.path.exists(test_csv):
        print(f"Error: Test dataset CSV not found at {test_csv}. Please run make_dataset first.")
        return

    test_df = pd.read_csv(test_csv)
    test_ds = SignalScopeDataset(test_df, image_size=config['data'].get('image_size', 224), is_train=False)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=config.get('train', {}).get('batch_size', 16), shuffle=False)

    all_y_true = []
    all_y_prob = []
    all_unseen_flags = []

    with torch.no_grad():
        for batch in tqdm(test_loader, desc="Evaluating"):
            pixel_values = batch['pixel_values'].to(device)
            fft_features = batch['fft_features'].to(device)
            labels = batch['label'].to(device)
            is_unseen = batch['is_unseen']

            with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
                if model_type == "baseline":
                    probs = torch.softmax(model(pixel_values), dim=-1)
                else:
                    probs = model.predict_probabilities(pixel_values, fft_features)
                fake_probs = probs[:, 1].cpu().numpy()

            all_y_true.extend(labels.cpu().numpy())
            all_y_prob.extend(fake_probs)
            all_unseen_flags.extend(is_unseen.numpy())


    # Compute metrics
    overall_metrics = compute_metrics(all_y_true, all_y_prob)
    unseen_metrics = compute_unseen_metrics(all_y_true, all_y_prob, all_unseen_flags)

    report = {
        "overall": overall_metrics,
        "unseen_generators": unseen_metrics
    }

    print("\n--- Evaluation Results ---")
    print(f"Overall ROC-AUC:        {overall_metrics['roc_auc']}")
    print(f"Overall Macro-F1:       {overall_metrics['macro_f1']}")
    print(f"Overall Accuracy:       {overall_metrics['accuracy']}")
    print(f"Overall FPR:            {overall_metrics['false_positive_rate']}")
    print(f"Unseen Generators AUC:  {unseen_metrics.get('roc_auc', 'N/A')}")
    print("--------------------------\n")

    output_path = os.path.join('report', 'metrics.json')
    save_metrics(report, output_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_path', type=str, default='models/trained/signalscope-final')
    parser.add_argument('--config', type=str, default='configs/train_config.yaml')
    parser.add_argument('--model_type', choices=['signalscope', 'baseline'], default='signalscope')
    args = parser.parse_args()

    evaluate_checkpoint(args.model_path, args.config, args.model_type)
