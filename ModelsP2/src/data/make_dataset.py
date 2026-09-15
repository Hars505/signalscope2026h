import os
import glob
import json
import argparse
import yaml
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split


def _load_all_data(raw_dir, use_genimage=False):
    """
    Scans data/raw layout:
    data/raw/real/<source_name>/*.jpg|png
    data/raw/fake/<generator_name>/*.jpg|png
    """
    records = []
    supported_exts = ('*.jpg', '*.jpeg', '*.png', '*.webp', '*.BMP')

    # Load real images
    real_dir = os.path.join(raw_dir, 'real')
    if os.path.exists(real_dir):
        for root, _, files in os.walk(real_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
                    full_path = os.path.join(root, file)
                    rel_dir = os.path.relpath(root, real_dir)
                    generator = rel_dir if rel_dir != '.' else 'real_photos'
                    records.append({
                        'path': full_path,
                        'label': 0,  # real
                        'generator': generator,
                        'source': 'real'
                    })

    # Load fake images
    fake_dir = os.path.join(raw_dir, 'fake')
    if os.path.exists(fake_dir):
        for root, _, files in os.walk(fake_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
                    full_path = os.path.join(root, file)
                    rel_dir = os.path.relpath(root, fake_dir)
                    generator = rel_dir.split(os.sep)[0] if rel_dir != '.' else 'unknown_fake'
                    records.append({
                        'path': full_path,
                        'label': 1,  # fake
                        'generator': generator,
                        'source': 'fake'
                    })

    df = pd.DataFrame(records)
    return df


def _limit_class_counts(df, data_cfg):
    """Keep the requested balanced subset after scanning the raw directory."""
    limits = data_cfg.get("class_limits", {})
    if not limits:
        return df
    selected = []
    for label, limit in ((0, limits.get("real")), (1, limits.get("fake"))):
        if limit is None:
            selected.append(df[df["label"] == label])
            continue
        selected.append(
            df[df["label"] == label].sample(
                n=min(int(limit), int((df["label"] == label).sum())),
                random_state=data_cfg.get("seed", 42),
            )
        )
    return pd.concat(selected, ignore_index=True)


def build_splits(config_path):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    data_cfg = config['data']
    raw_dir = data_cfg['raw_dir']
    processed_dir = data_cfg['processed_dir']
    seed = data_cfg.get('seed', 42)
    holdout_num = data_cfg.get('holdout_generators', 1)

    os.makedirs(processed_dir, exist_ok=True)
    df = _load_all_data(raw_dir, use_genimage=data_cfg.get('use_genimage', False))
    df = _limit_class_counts(df, data_cfg)

    if df.empty:
        print(f"Warning: No images found under {raw_dir}. Creating empty CSV templates in {processed_dir}.")
        empty_df = pd.DataFrame(columns=['path', 'label', 'generator', 'source', 'is_unseen'])
        empty_df.to_csv(os.path.join(processed_dir, 'train.csv'), index=False)
        empty_df.to_csv(os.path.join(processed_dir, 'val.csv'), index=False)
        empty_df.to_csv(os.path.join(processed_dir, 'test.csv'), index=False)
        report = {"status": "empty_raw_dir", "total_samples": 0}
        with open(os.path.join(processed_dir, 'data_report.json'), 'w') as f:
            json.dump(report, f, indent=2)
        return

    # Identify fake generators
    fake_generators = list(df[df['label'] == 1]['generator'].unique())
    np.random.seed(seed)
    
    unseen_generators = []
    if len(fake_generators) >= holdout_num and holdout_num > 0:
        unseen_generators = list(np.random.choice(fake_generators, size=holdout_num, replace=False))

    df['is_unseen'] = df['generator'].isin(unseen_generators)

    # Separate unseen generator samples (must go into test split only)
    unseen_df = df[df['is_unseen']].copy()
    seen_df = df[~df['is_unseen']].copy()

    # Stratified train/val/test split on seen data
    train_ratio = data_cfg['train_split']
    val_ratio = data_cfg['val_split']
    test_ratio = data_cfg['test_split']

    val_test_ratio = val_ratio + test_ratio
    relative_test_ratio = test_ratio / val_test_ratio

    # Combine generator and label for stratification key
    seen_df['strat_key'] = seen_df['label'].astype(str) + "_" + seen_df['generator'].astype(str)

    train_df, temp_df = train_test_split(
        seen_df,
        train_size=train_ratio,
        random_state=seed,
        stratify=seen_df['strat_key'] if len(seen_df['strat_key'].unique()) > 1 else None
    )

    if val_ratio == 0.0:
        val_df = pd.DataFrame(columns=seen_df.columns)
        test_seen_df = temp_df
    else:
        val_test_ratio = val_ratio + test_ratio
        relative_test_ratio = test_ratio / val_test_ratio

        val_df, test_seen_df = train_test_split(
            temp_df,
            test_size=relative_test_ratio,
            random_state=seed,
            stratify=temp_df['strat_key'] if len(temp_df['strat_key'].unique()) > 1 else None
        )

    # Combine unseen fake generators into test split
    test_df = pd.concat([test_seen_df, unseen_df], ignore_index=True)

    # Cleanup temporary key
    train_df = train_df.drop(columns=['strat_key'], errors='ignore')
    val_df = val_df.drop(columns=['strat_key'], errors='ignore')
    test_df = test_df.drop(columns=['strat_key'], errors='ignore')

    # Save CSVs
    train_df.to_csv(os.path.join(processed_dir, 'train.csv'), index=False)
    val_df.to_csv(os.path.join(processed_dir, 'val.csv'), index=False)
    test_df.to_csv(os.path.join(processed_dir, 'test.csv'), index=False)

    report = {
        "total_samples": len(df),
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "unseen_generators": unseen_generators,
        "class_distribution": {
            "train": train_df['label'].value_counts().to_dict(),
            "val": val_df['label'].value_counts().to_dict(),
            "test": test_df['label'].value_counts().to_dict()
        }
    }

    with open(os.path.join(processed_dir, 'data_report.json'), 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Data processing complete. Report saved to {os.path.join(processed_dir, 'data_report.json')}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='configs/train_config.yaml')
    args = parser.parse_args()
    build_splits(args.config)
