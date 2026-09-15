# Dataset and third-party attribution

The repository contains locally prepared subsets. The links below are the
source records used to prepare them; the local image files do not carry their
own license metadata. Licence statements apply only as described by each
source card and must be rechecked before public or commercial redistribution.

| Source and exact URL | Repository use | Licence/terms recorded | Required attribution |
|---|---|---|---|
| [CIFAKE on Kaggle](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images) | CIFAKE-style baseline data and report | Kaggle describes the dataset as published under the same MIT licence as CIFAR-10. The real images originate from [CIFAR-10](https://www.cs.toronto.edu/~kriz/cifar.html); generated images are documented by the dataset authors. Preserve the MIT notice and verify redistribution terms for the exact downloaded copy. | Jordan J. Bird and A. Lotfi, *CIFAKE: Image Classification and Explainable Identification of AI-Generated Synthetic Images*; cite the [IEEE paper](https://ieeexplore.ieee.org/abstract/document/10409290) and CIFAR-10 authors. |
| [Hemg/AI-Generated-vs-Real-Images-Datasets](https://huggingface.co/datasets/Hemg/AI-Generated-vs-Real-Images-Datasets) | 24,000 train / 4,000 validation / 8,000 test subset used for ModelsP2 production training | The dataset card currently provides labels and dataset size but no explicit licence grant. Treat the subset as research-only and request/confirm permission before redistribution or commercial use. | Credit the Hugging Face dataset and its author account `Hemg`; retain the source URL. |
| [Parveshiiii/AI-vs-Real](https://huggingface.co/datasets/Parveshiiii/AI-vs-Real) | 4,998 train / 832 validation / 836 proxy-test continuation subset | The current Hugging Face dataset card declares `MIT`. Preserve the MIT notice and confirm that the card's licence covers the exact image sources. | Parvesh Rawal, *AI-vs-Real Dataset (2025)*; retain the source URL. |
| SIH 2026 organizer dataset | Required official held-out evaluation data | Not present in this repository; use only under the organizer's supplied terms and do not redistribute. | Cite the SIH 2026 SignalScope problem statement and organizer instructions. |
| PyTorch, torchvision, Transformers, Django, React/Vite | Runtime dependencies | Each dependency retains its upstream licence; see the package manifests and upstream notices. | Preserve required package notices in deployed distributions. |

## Reproduction source mapping

The subset preparation scripts use these exact dataset identifiers:

```text
ModelsP2/scripts/prepare_hemg_subset.py
  Hemg/AI-Generated-vs-Real-Images-Datasets

ModelsP2/scripts/prepare_parveshiiii_subset.py
  Parveshiiii/AI-vs-Real
```

The local subsets are derived copies, not new datasets. Do not describe them
as independently licensed datasets.

## Originality declaration

SignalScope's application integration, weighted ensemble orchestration,
metadata handling, evaluation utility, and deployment wiring were developed
for this repository. The project uses standard open-source libraries and
public dataset tooling; model architectures and library APIs are not claimed
as original inventions. Any future submission should add the team members'
names, repository commit range, exact source URLs, and any copied snippets or
notebooks required by the event rules.
