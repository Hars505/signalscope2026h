"""Stream a balanced 16,000-image AI-vs-real continuation subset."""

import argparse
from pathlib import Path
from collections import Counter

import pandas as pd
from datasets import load_dataset


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="Parveshiiii/AI-vs-Real")
    parser.add_argument("--output", default="data/parveshiiii_subset")
    parser.add_argument("--total", type=int, default=16000)
    args = parser.parse_args()

    dataset = load_dataset(args.dataset, split="train", streaming=True)
    source_counts = Counter(int(row["binary_label"]) for row in dataset)
    available_per_class = min(source_counts.get(0, 0), source_counts.get(1, 0))
    requested_per_class = args.total // 2
    if available_per_class < requested_per_class:
        raise RuntimeError(
            f"{args.dataset} has only {available_per_class} samples per class "
            f"({dict(source_counts)}); cannot create a balanced {args.total}-image subset. "
            f"The largest balanced subset is {available_per_class * 2} images."
        )

    per_class = requested_per_class
    split_targets = {
        "train": {0: per_class * 3 // 4, 1: per_class * 3 // 4},
        "validation": {0: per_class // 8, 1: per_class // 8},
        "test": {
            0: per_class - (per_class * 3 // 4) - (per_class // 8),
            1: per_class - (per_class * 3 // 4) - (per_class // 8),
        },
    }
    counts = {split: {0: 0, 1: 0} for split in split_targets}
    records = {split: [] for split in split_targets}
    root = Path(args.output)

    dataset = load_dataset(args.dataset, split="train", streaming=True)
    for row_index, row in enumerate(dataset):
        # Dataset mapping: 0 = AI, 1 = real. ModelsP2 mapping: 1 = AI, 0 = real.
        label = 1 if int(row["binary_label"]) == 0 else 0
        split = next(
            (
                name for name in ("train", "validation", "test")
                if counts[name][label] < split_targets[name][label]
            ),
            None,
        )
        if split is None:
            if all(
                counts[name][class_id] >= split_targets[name][class_id]
                for name in split_targets
                for class_id in (0, 1)
            ):
                break
            continue

        image = row["image"].convert("RGB")
        image.thumbnail((512, 512))
        class_name = "real" if label == 0 else "fake"
        destination = root / "raw" / class_name / split
        destination.mkdir(parents=True, exist_ok=True)
        path = destination / f"{counts[split][label]:06d}_{row_index}.jpg"
        image.save(path, format="JPEG", quality=95)
        counts[split][label] += 1
        records[split].append(
            {
                "path": str(path),
                "label": label,
                "generator": "parveshiiii",
                "source": "parveshiiii",
                "is_unseen": False,
            }
        )

        if row_index % 1000 == 0:
            print(row_index, counts, flush=True)

    for split, expected in split_targets.items():
        if counts[split] != expected:
            raise RuntimeError(f"{split}: expected {expected}, got {counts[split]}")
        print(f"{split}: {counts[split]}")

    processed = root / "processed"
    processed.mkdir(parents=True, exist_ok=True)
    for split, filename in (
        ("train", "train.csv"),
        ("validation", "val.csv"),
        ("test", "test.csv"),
    ):
        pd.DataFrame(records[split]).to_csv(processed / filename, index=False)
    print(f"Manifests written to {processed}")


if __name__ == "__main__":
    main()
