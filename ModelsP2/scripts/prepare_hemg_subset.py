"""Stream a balanced Hemg AI-vs-real subset into ModelsP2 manifests."""

import argparse
from pathlib import Path

import pandas as pd
from datasets import load_dataset


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        default="Hemg/AI-Generated-vs-Real-Images-Datasets",
    )
    parser.add_argument("--output", default="data/hemg_subset")
    parser.add_argument("--train-per-class", type=int, default=12000)
    parser.add_argument("--validation-per-class", type=int, default=2000)
    parser.add_argument("--test-per-class", type=int, default=4000)
    args = parser.parse_args()

    root = Path(args.output)
    targets = {
        "train": {0: args.train_per_class, 1: args.train_per_class},
        "validation": {0: args.validation_per_class, 1: args.validation_per_class},
        "test": {0: args.test_per_class, 1: args.test_per_class},
    }
    counts = {split: {0: 0, 1: 0} for split in targets}
    records = {split: [] for split in targets}

    dataset = load_dataset(args.dataset, split="train", streaming=True)
    for row_index, row in enumerate(dataset):
        source_label = int(row["label"])
        # Hemg label names are AiArtData=0 and RealArt=1.
        label = 1 if source_label == 0 else 0
        image = row["image"].convert("RGB")

        split = None
        for candidate in ("train", "validation", "test"):
            if counts[candidate][label] < targets[candidate][label]:
                split = candidate
                break
        if split is None:
            if all(
                counts[name][class_id] >= targets[name][class_id]
                for name in targets
                for class_id in (0, 1)
            ):
                break
            continue

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
                "generator": "hemg",
                "source": "hemg",
                "is_unseen": False,
            }
        )

        if row_index % 1000 == 0:
            print(row_index, counts, flush=True)

    for split, split_counts in counts.items():
        if any(value < target for value, target in zip(
            split_counts.values(), targets[split].values()
        )):
            raise RuntimeError(
                f"{split}: expected {targets[split]}, got {split_counts}"
            )
        print(f"{split}: {split_counts}")

    processed = root / "processed"
    processed.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(records["train"]).to_csv(processed / "train.csv", index=False)
    pd.DataFrame(records["validation"]).to_csv(processed / "val.csv", index=False)
    pd.DataFrame(records["test"]).to_csv(processed / "test.csv", index=False)
    print(f"Manifests written to {processed}")


if __name__ == "__main__":
    main()
