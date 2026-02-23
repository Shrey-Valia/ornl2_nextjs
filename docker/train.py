from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch import nn
import torch.nn.functional as F
from torch.func import vmap, jacrev


class NNModel(nn.Module):
    """Main network trained on data."""

    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(5, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 6)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.tanh(self.fc1(x))
        x = torch.tanh(self.fc2(x))
        x = self.fc3(x)
        return x


class DomainModel(nn.Module):
    """Pretrained theory network used for Jacobian guidance."""

    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(5, 128)
        self.fc2 = nn.Linear(128, 128)
        self.fc3 = nn.Linear(128, 64)
        self.Xout = nn.Linear(64, 1)
        self.Mout = nn.Linear(64, 5)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.relu(self.fc3(x))
        x_out = torch.sigmoid(self.Xout(x))
        m_out = torch.nn.functional.softplus(self.Mout(x))
        return torch.cat((x_out, m_out), dim=-1)


def scale_feature_zero_one(x: np.ndarray, scaler_max: np.ndarray, scaler_min: np.ndarray) -> np.ndarray:
    return (x - scaler_min) / (scaler_max - scaler_min)


def load_dataset(excel_path: Path, scaler_max: np.ndarray, scaler_min: np.ndarray):
    df = pd.read_excel(excel_path)
    required_cols_x = ["[M]", "[S]", "[I]", "temp", "time", "Reaction"]
    required_cols_y = ["X", "Mn", "Mw", "Mz", "Mzplus1", "Mv"]
    for col in required_cols_x + required_cols_y:
        if col not in df.columns:
            raise ValueError(f"Missing required column in Excel: {col}")

    xdata = df[required_cols_x].values.astype(np.float32)
    ydata = df[required_cols_y].values.astype(np.float32)

    # log10 scale molecular weights for training stability
    ydata[:, 1:] = np.log10(ydata[:, 1:])

    # scale input features to 0-1
    xdata[:, :5] = scale_feature_zero_one(xdata[:, :5], scaler_max, scaler_min)

    return xdata, ydata


def train_nn(
    x_train: torch.Tensor,
    y_train: torch.Tensor,
    x_test: torch.Tensor,
    y_test: torch.Tensor,
    epochs: int,
    lr: float,
):
    model = NNModel()
    loss_fn = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    train_losses = []
    test_losses = []

    for _ in range(epochs):
        model.train()
        pred = model(x_train)
        loss = loss_fn(pred, y_train)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            test_loss = loss_fn(model(x_test), y_test)

        train_losses.append(float(loss.detach().cpu()))
        test_losses.append(float(test_loss.detach().cpu()))

    return model, train_losses, test_losses


def train_pcinn(
    x_train: torch.Tensor,
    y_train: torch.Tensor,
    x_test: torch.Tensor,
    y_test: torch.Tensor,
    domain_model: nn.Module,
    scaler_min: np.ndarray,
    scaler_max: np.ndarray,
    epochs: int,
    lr: float,
    jac_samples: int,
    data_weight: float,
    jac_weight: float,
):
    model = NNModel()
    loss_fn = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    # Jacobian sampling ranges
    t_upper, t_lower = 273 + 90, 273 + 50
    m_upper, m_lower = 5, 0.5
    i_upper, i_lower = 0.1, 0.005
    time_upper, time_lower = 10 * 60 * 60, 5 * 60

    m_sampler = torch.distributions.Uniform(low=m_lower, high=m_upper)
    t_sampler = torch.distributions.Uniform(low=t_lower, high=t_upper)
    i_sampler = torch.distributions.Uniform(low=i_lower, high=i_upper)
    time_sampler = torch.distributions.Uniform(low=time_lower, high=time_upper)

    scaler_min_t = torch.from_numpy(scaler_min).float()
    scaler_max_t = torch.from_numpy(scaler_max).float()

    train_losses = []
    test_losses = []
    jac_losses = []

    for _ in range(epochs):
        model.train()
        pred = model(x_train)
        data_loss = loss_fn(pred, y_train)

        # sample jacobian points
        m_sample = m_sampler.sample((jac_samples, 1))
        s_sample = (10 - m_sample)
        i_sample = i_sampler.sample((jac_samples, 1))
        t_sample = t_sampler.sample((jac_samples, 1))
        time_sample = time_sampler.sample((jac_samples, 1))

        sample = torch.cat((m_sample, s_sample, i_sample, t_sample, time_sample), dim=1)
        sample = (sample - scaler_min_t) / (scaler_max_t - scaler_min_t)

        domain_model.eval()
        model.eval()
        jac_theory = vmap(jacrev(domain_model))(sample.float())
        jac_model = vmap(jacrev(model))(sample.float())

        jac_loss = loss_fn(jac_model, jac_theory)
        total_loss = (data_weight * data_loss) + (jac_weight * jac_loss)

        model.train()
        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            test_loss = loss_fn(model(x_test), y_test)

        train_losses.append(float(data_loss.detach().cpu()))
        test_losses.append(float(test_loss.detach().cpu()))
        jac_losses.append(float(jac_loss.detach().cpu()))

    return model, train_losses, test_losses, jac_losses


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel", required=True, help="Path to PMMAordered.xlsx")
    parser.add_argument("--assets-dir", default=None, help="Folder containing scalers + MMA_solution_net.pt")
    parser.add_argument("--out-dir", default=None, help="Where to write trained weights")
    parser.add_argument("--test-reaction", type=int, default=8)
    parser.add_argument("--epochs", type=int, default=10000)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--jac-samples", type=int, default=32)
    parser.add_argument("--data-weight", type=float, default=1.0, help="Weight for data loss term")
    parser.add_argument("--jac-weight", type=float, default=1.0, help="Weight for Jacobian loss term")
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    script_dir = Path(__file__).resolve().parent
    assets_dir = Path(args.assets_dir) if args.assets_dir else script_dir
    out_dir = Path(args.out_dir) if args.out_dir else script_dir / "models"
    out_dir.mkdir(parents=True, exist_ok=True)

    scaler_max = np.load(assets_dir / "scalerx_max.npy")
    scaler_min = np.load(assets_dir / "scalerx_min.npy")

    xdata, ydata = load_dataset(Path(args.excel), scaler_max, scaler_min)

    test_mask = xdata[:, 5] == args.test_reaction
    train_mask = ~test_mask

    x_train = torch.from_numpy(xdata[train_mask, :5]).float()
    y_train = torch.from_numpy(ydata[train_mask]).float()

    x_test = torch.from_numpy(xdata[test_mask, :5]).float()
    y_test = torch.from_numpy(ydata[test_mask]).float()

    # Load domain model for Jacobians
    domain_model = DomainModel()
    domain_model.load_state_dict(torch.load(assets_dir / "MMA_solution_net.pt", map_location="cpu"))
    domain_model.eval()

    # Train baseline NN
    nn_model, nn_train_losses, nn_test_losses = train_nn(
        x_train, y_train, x_test, y_test, args.epochs, args.lr
    )

    # Train PCINN
    pcinn_model, pcinn_train_losses, pcinn_test_losses, pcinn_jac_losses = train_pcinn(
        x_train,
        y_train,
        x_test,
        y_test,
        domain_model,
        scaler_min,
        scaler_max,
        args.epochs,
        args.lr,
        args.jac_samples,
        args.data_weight,
        args.jac_weight,
    )

    # Save weights
    torch.save(nn_model.state_dict(), out_dir / "nn_model.pt")
    torch.save(pcinn_model.state_dict(), out_dir / "pcinn_model.pt")

    # Save metrics summary
    summary = {
        "excel_path": str(Path(args.excel).resolve()),
        "assets_dir": str(assets_dir.resolve()),
        "out_dir": str(out_dir.resolve()),
        "test_reaction": args.test_reaction,
        "epochs": args.epochs,
        "lr": args.lr,
        "jac_samples": args.jac_samples,
        "data_weight": args.data_weight,
        "jac_weight": args.jac_weight,
        "num_train_rows": int(train_mask.sum()),
        "num_test_rows": int(test_mask.sum()),
        "final_nn_test_loss": nn_test_losses[-1],
        "final_pcinn_test_loss": pcinn_test_losses[-1],
        "outputs": ["nn_model.pt", "pcinn_model.pt", "metrics.json"],
    }

    (out_dir / "metrics.json").write_text(json.dumps(summary, indent=2))

    print("Training complete.")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
