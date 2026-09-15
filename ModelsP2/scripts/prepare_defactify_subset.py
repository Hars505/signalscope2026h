"""Download a balanced Defactify subset without materializing the full dataset."""

import argparse
from pathlib import Path

from datasets import load_dataset
import pandas as pd


def collect_split(dataset_name, split, output_root, per_class, start_index=0):
    output_root = Path(output_root)
    counts = {0: 0, 1: 0}
    seen = {0: 0, 1: 0}
    dataset = load_dataset(dataset_name, split=split, streaming=True)

    for row in dataset:
        label = int(row["Label_A"])
        if label not in counts or counts[label] >= per_class:
            if all(value >= per_class for value in counts.values()):
                break
            continue

        image = row["Image"].convert("RGB")
        class_name = "real" if label == 0 else "fake"
        target_dir = output_root / class_name / split
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{start_index + seen[label]:06d}.jpg"
        image.save(target_dir / filename, format="JPEG", quality=95)
        counts[label] += 1
        seen[label] += 1

        if all(value >= per_class for value in counts.values()):
            break

    if any(value < per_class for value in counts.values()):
        raise RuntimeError(
            f"{split}: expected {per_class} per class, got {counts}"
        )
    print(f"{split}: {counts}")
    records = []
    for label, class_name in ((0, "real"), (1, "fake")):
        for path in sorted((output_root / class_name / split).glob("*.jpg")):
            records.append({
                "path": str(path),
                "label": label,
                "generator": "defactify",
                "source": "defactify",
                "is_unseen": False,
            })
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        default="Rajarshi-Roy-research/Defactify_Image_Dataset",
    )
    parser.add_argument("--output", default="data/defactify_subset/raw")
    parser.add_argument("--train-per-class", type=int, default=12000)
    parser.add_argument("--validation-per-class", type=int, default=2000)
    parser.add_argument("--test-per-class", type=int, default=4000)
    args = parser.parse_args()

    root = Path(args.output)
    train_records = collect_split(
        args.dataset,
        "train",
        root,
        args.train_per_class,
        start_index=0,
    )
    validation_records = collect_split(
        args.dataset,
        "validation",
        root,
        args.validation_per_class,
        start_index=100000,
    )
    test_records = collect_split(
        args.dataset,
        "test",
        root,
        args.test_per_class,
        start_index=200000,
    )
    processed = root.parent / "processed"
    processed.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(train_records).to_csv(processed / "train.csv", index=False)
    pd.DataFrame(validation_records).to_csv(processed / "val.csv", index=False)
    pd.DataFrame(test_records).to_csv(processed / "test.csv", index=False)
    print(f"Wrote manifests to {processed}")


if __name__ == "__main__":
    main()
