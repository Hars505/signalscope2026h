import os
import torch
import numpy as np
import pandas as pd
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms


def compute_fft_spectrum(image_pil):
    """
    Computes 2D FFT log-magnitude spectrum of an image.
    Returns a 1-channel float tensor of shape (1, H, W) normalized to [0, 1].
    """
    # Convert to grayscale for frequency analysis
    gray = image_pil.convert('L')
    img_np = np.array(gray, dtype=np.float32)

    # 2D FFT and shift zero-frequency component to center
    f = np.fft.fft2(img_np)
    fshift = np.fft.fftshift(f)

    # Log magnitude spectrum
    magnitude = np.abs(fshift)
    log_magnitude = np.log(1.0 + magnitude)

    # Normalize to [0, 1]
    max_val = np.max(log_magnitude)
    if max_val > 0:
        log_magnitude = log_magnitude / max_val

    tensor = torch.tensor(log_magnitude, dtype=torch.float32).unsqueeze(0)
    return tensor


class SignalScopeDataset(Dataset):
    """
    Dataset class producing:
    - pixel_values: (3, 224, 224) normalized image tensor for ViT
    - fft_features: (1, 224, 224) log-magnitude FFT spectrum tensor
    - label: int (0=real, 1=fake)
    """
    def __init__(self, csv_file, image_size=224, is_train=False):
        self.df = pd.read_csv(csv_file) if isinstance(csv_file, str) else csv_file
        self.image_size = image_size
        self.is_train = is_train

        # RGB Image preprocessing transform for ViT backbone
        if is_train:
            self.img_transform = transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.RandomHorizontalFlip(),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])
            ])
        else:
            self.img_transform = transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])
            ])

        self.resize = transforms.Resize((image_size, image_size))

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row['path']

        try:
            image = Image.open(img_path).convert('RGB')
        except Exception:
            # Fallback black image if loading fails
            image = Image.new('RGB', (self.image_size, self.image_size), color=0)

        # ViT input tensor
        pixel_values = self.img_transform(image)

        # Resized image for FFT calculation
        resized_img = self.resize(image)
        fft_features = compute_fft_spectrum(resized_img)

        label = int(row['label']) if 'label' in row else 0
        generator = row['generator'] if 'generator' in row else 'unknown'
        is_unseen = bool(row['is_unseen']) if 'is_unseen' in row else False

        return {
            'pixel_values': pixel_values,
            'fft_features': fft_features,
            'label': torch.tensor(label, dtype=torch.long),
            'generator': generator,
            'is_unseen': is_unseen
        }


def get_dataloaders(config):
    data_cfg = config['data']
    processed_dir = data_cfg['processed_dir']
    batch_size = config.get('train', {}).get('batch_size', 16)
    num_workers = data_cfg.get('num_workers', 2)
    pin_memory = data_cfg.get(
        'pin_memory',
        torch.cuda.is_available(),
    )
    image_size = data_cfg.get('image_size', 224)

    train_csv = os.path.join(processed_dir, 'train.csv')
    val_csv = os.path.join(processed_dir, 'val.csv')
    test_csv = os.path.join(processed_dir, 'test.csv')

    train_ds = SignalScopeDataset(train_csv, image_size=image_size, is_train=True) if os.path.exists(train_csv) else None
    val_ds = SignalScopeDataset(val_csv, image_size=image_size, is_train=False) if os.path.exists(val_csv) else None
    test_ds = SignalScopeDataset(test_csv, image_size=image_size, is_train=False) if os.path.exists(test_csv) else None

    loaders = {}
    if train_ds:
        loaders['train'] = DataLoader(
            train_ds,
            batch_size=batch_size,
            shuffle=True,
            num_workers=num_workers,
            pin_memory=pin_memory,
            persistent_workers=num_workers > 0,
        )
    if val_ds:
        loaders['val'] = DataLoader(
            val_ds,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=pin_memory,
            persistent_workers=num_workers > 0,
        )
    if test_ds:
        loaders['test'] = DataLoader(
            test_ds,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=pin_memory,
            persistent_workers=num_workers > 0,
        )

    return loaders
