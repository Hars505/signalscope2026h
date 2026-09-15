import torch
import torch.nn as nn
import torch.optim as optim


class TemperatureScaler(nn.Module):
    """
    Post-hoc temperature scaling calibration module.
    Optimizes a single scalar parameter T to minimize NLL loss on validation set logits.
    """
    def __init__(self):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

    def forward(self, logits):
        temp = self.temperature.to(logits.device)
        return logits / temp


    def fit(self, model, val_loader, device='cpu', lr=0.01, max_iter=50):
        """
        Learns temperature parameter T on validation set logits.
        """
        model.eval()
        logits_list = []
        labels_list = []

        with torch.no_grad():
            for batch in val_loader:
                pixel_values = batch['pixel_values'].to(device)
                fft_features = batch['fft_features'].to(device)
                labels = batch['label'].to(device)

                logits = model(pixel_values, fft_features)
                logits_list.append(logits)
                labels_list.append(labels)

        logits = torch.cat(logits_list, dim=0)
        labels = torch.cat(labels_list, dim=0)

        nll_criterion = nn.CrossEntropyLoss()
        optimizer = optim.LBFGS([self.temperature], lr=lr, max_iter=max_iter)

        def eval_step():
            optimizer.zero_grad()
            loss = nll_criterion(self.forward(logits), labels)
            loss.backward()
            return loss

        optimizer.step(eval_step)

        optimal_temp = float(self.temperature.item())
        print(f"Optimal temperature parameter T: {optimal_temp:.4f}")

        # Update model's internal temperature parameter
        if hasattr(model, 'temperature'):
            model.temperature.data = self.temperature.data.clone()

        return optimal_temp
