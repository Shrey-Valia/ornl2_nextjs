from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
import json
import os
import io

app = FastAPI(title="MMA PCINN Model API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# DomainModel - PCINN "Theory Network"
# =============================================================================
class DomainModel(nn.Module):
    def __init__(self):
        super(DomainModel, self).__init__()
        self.fc1 = nn.Linear(5, 128)
        self.fc2 = nn.Linear(128, 128)
        self.fc3 = nn.Linear(128, 64)
        self.Xout = nn.Linear(64, 1)
        self.Mout = nn.Linear(64, 5)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.relu(self.fc3(x))
        X_out = F.sigmoid(self.Xout(x))
        M_out = F.softplus(self.Mout(x))
        return X_out, M_out


script_dir = os.path.dirname(os.path.abspath(__file__))

# =============================================================================
# Load Scalers
# =============================================================================
scalerx_max = None
scalerx_min = None
scalers_loaded = False

try:
    scalerx_max_path = os.path.join(script_dir, 'scalerx_max.npy')
    scalerx_min_path = os.path.join(script_dir, 'scalerx_min.npy')
    if os.path.exists(scalerx_max_path) and os.path.exists(scalerx_min_path):
        scalerx_max = np.load(scalerx_max_path)
        scalerx_min = np.load(scalerx_min_path)
        scalers_loaded = True
        print(f"✅ Scalers loaded: min={scalerx_min}, max={scalerx_max}")
    else:
        print("⚠️ Scaler files not found - predictions may be inaccurate!")
except Exception as e:
    print(f"⚠️ Error loading scalers: {e}")


def normalize_input(x: np.ndarray) -> np.ndarray:
    if not scalers_loaded:
        return x
    return (x - scalerx_min) / (scalerx_max - scalerx_min + 1e-8)


# =============================================================================
# Load Model
# =============================================================================
model_path = os.path.join(script_dir, 'MMA_solution_net.pt')

model = DomainModel()
state_dict = torch.load(model_path, map_location=torch.device('cpu'))
model.load_state_dict(state_dict)
model.eval()
print(f"✅ PCINN Model loaded from {model_path}")

# =============================================================================
# Request/Response Schemas
# =============================================================================
class PredictionRequest(BaseModel):
    M: float
    S: float
    I: float
    temp: float
    time: float
    Reaction: float

class PredictionResponse(BaseModel):
    success: bool
    input: dict
    x_output: list
    m_output: list
    conversion: float
    molecular_weights: dict
    scalers_used: bool
    warnings: list = []

class TrainRequest(BaseModel):
    csv_content: str      # CSV file contents sent directly from Next.js
    epochs: int = 1000
    lr: float = 3e-4
    data_weight: float = 1.0
    jac_weight: float = 1.0
    test_reaction: int = 8
    jac_samples: int = 32


# =============================================================================
# API Endpoints
# =============================================================================
@app.get("/")
def read_root():
    return {
        "message": "MMA PCINN Model API",
        "version": "2.0.0",
        "scalers_loaded": scalers_loaded,
        "endpoints": {
            "/predict": "POST - Run PCINN prediction",
            "/train": "POST - Train NN + PCINN (streaming)",
            "/health": "GET - Health check"
        },
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True, "scalers_loaded": scalers_loaded}


@app.post("/debug")
async def debug_request(request: Request):
    body = await request.json()
    print(f"DEBUG: Raw request body: {body}")
    return {"received": body}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    warnings = []

    if request.M < 0 or request.S < 0 or request.I < 0:
        warnings.append("Negative concentrations detected - results may be invalid")
    if request.temp < 273 or request.temp > 500:
        warnings.append(f"Temperature {request.temp}K outside typical range (273-500K)")
    if request.time < 0:
        warnings.append("Negative time is not physical")

    raw_input = np.array([[request.M, request.S, request.I, request.temp, request.time]], dtype=np.float32)
    normalized_input = normalize_input(raw_input)

    if not scalers_loaded:
        warnings.append("Scalers not loaded - using raw inputs (predictions may be inaccurate)")

    input_tensor = torch.tensor(normalized_input, dtype=torch.float32)

    with torch.no_grad():
        x_out, m_out = model(input_tensor)

    x_output = x_out.cpu().numpy().tolist()[0]
    m_output = m_out.cpu().numpy().tolist()[0]

    conversion = float(x_output) if isinstance(x_output, (int, float)) else float(x_output[0])

    molecular_weights = {
        "Mn": float(10 ** m_output[0]),
        "Mw": float(10 ** m_output[1]),
        "Mz": float(10 ** m_output[2]),
        "Mz_plus1": float(10 ** m_output[3]),
        "Mv": float(10 ** m_output[4]),
        "PDI": float(10 ** m_output[1]) / float(10 ** m_output[0])
    }

    return PredictionResponse(
        success=True,
        input={"M": request.M, "S": request.S, "I": request.I, "temp": request.temp, "time": request.time, "Reaction": request.Reaction},
        x_output=x_output if isinstance(x_output, list) else [x_output],
        m_output=m_output,
        conversion=conversion,
        molecular_weights=molecular_weights,
        scalers_used=scalers_loaded,
        warnings=warnings
    )


@app.post("/train")
def train_model(request: TrainRequest):
    """Train NN + PCINN on CSV content, streaming NDJSON progress."""

    def generate():
        def emit(obj: dict) -> str:
            return json.dumps(obj) + "\n"

        try:
            yield emit({"type": "log", "message": "📂 Parsing CSV data..."})

            try:
                df = pd.read_csv(io.StringIO(request.csv_content))
            except Exception as e:
                yield emit({"type": "error", "message": f"Failed to parse CSV: {e}"})
                return

            df.columns = [c.strip() for c in df.columns]
            col_map = {c.lower(): c for c in df.columns}
            required_x = ['m', 's', 'i', 'temp', 'time', 'reaction']
            required_y = ['x', 'mn', 'mw', 'mz', 'mzplus1', 'mv']

            missing = [r for r in required_x + required_y if r not in col_map]
            if missing:
                yield emit({"type": "error", "message": f"Missing columns: {missing}"})
                return

            x_cols = [col_map[c] for c in required_x]
            y_cols = [col_map[c] for c in required_y]

            xdata = df[x_cols].values.astype(np.float32)
            ydata = df[y_cols].values.astype(np.float32)
            ydata[:, 1:] = np.log10(np.clip(ydata[:, 1:], 1e-6, None))

            if scalers_loaded:
                xdata[:, :5] = (xdata[:, :5] - scalerx_min) / (scalerx_max - scalerx_min + 1e-8)
            else:
                yield emit({"type": "log", "message": "⚠️  Scalers not loaded — using raw inputs"})

            test_mask = xdata[:, 5] == request.test_reaction
            train_mask = ~test_mask

            if train_mask.sum() == 0:
                yield emit({"type": "error", "message": f"No training rows found (test_reaction={request.test_reaction})"})
                return

            x_train = torch.from_numpy(xdata[train_mask, :5]).float()
            y_train = torch.from_numpy(ydata[train_mask]).float()
            x_test  = torch.from_numpy(xdata[test_mask, :5]).float() if test_mask.sum() > 0 else x_train
            y_test  = torch.from_numpy(ydata[test_mask]).float() if test_mask.sum() > 0 else y_train

            yield emit({"type": "log", "message": f"📊 Train rows: {int(train_mask.sum())} | Test rows: {int(test_mask.sum())}"})

            class NNModel(nn.Module):
                def __init__(self):
                    super().__init__()
                    self.fc1 = nn.Linear(5, 128)
                    self.fc2 = nn.Linear(128, 64)
                    self.fc3 = nn.Linear(64, 6)
                def forward(self, x):
                    x = torch.tanh(self.fc1(x))
                    x = torch.tanh(self.fc2(x))
                    return self.fc3(x)

            loss_fn = nn.MSELoss()
            log_every = max(1, request.epochs // 50)

            # Phase 1: NN
            yield emit({"type": "log", "message": "🧠 Phase 1/2: Training baseline NN..."})
            nn_model = NNModel()
            nn_opt = torch.optim.Adam(nn_model.parameters(), lr=request.lr)
            nn_test_losses = []

            for ep in range(1, request.epochs + 1):
                nn_model.train()
                loss = loss_fn(nn_model(x_train), y_train)
                nn_opt.zero_grad(); loss.backward(); nn_opt.step()
                nn_model.eval()
                with torch.no_grad():
                    val_loss = float(loss_fn(nn_model(x_test), y_test))
                tl = float(loss.detach())
                nn_test_losses.append(val_loss)
                if ep % log_every == 0 or ep == request.epochs:
                    yield emit({"type": "progress", "epoch": ep, "train_loss": tl, "val_loss": val_loss, "jac_loss": None,
                                "log": f"[NN] Epoch {ep}/{request.epochs} — train: {tl:.6f} | val: {val_loss:.6f}"})

            # Phase 2: PCINN
            yield emit({"type": "log", "message": "🔬 Phase 2/2: Training PCINN with Jacobian guidance..."})

            try:
                from torch.func import vmap, jacrev
                use_jac = True
            except ImportError:
                yield emit({"type": "log", "message": "⚠️  torch.func not available — skipping Jacobian loss"})
                use_jac = False

            pcinn_model = NNModel()
            pcinn_opt = torch.optim.Adam(pcinn_model.parameters(), lr=request.lr)
            scaler_min_t = torch.from_numpy(scalerx_min).float() if scalers_loaded else torch.zeros(5)
            scaler_max_t = torch.from_numpy(scalerx_max).float() if scalers_loaded else torch.ones(5)
            pcinn_test_losses = []

            for ep in range(1, request.epochs + 1):
                pcinn_model.train()
                data_loss = loss_fn(pcinn_model(x_train), y_train)
                jac_loss_val = 0.0

                if use_jac and request.jac_weight > 0:
                    sample = torch.rand(request.jac_samples, 5)
                    sample = (sample - scaler_min_t) / (scaler_max_t - scaler_min_t + 1e-8)
                    model.eval(); pcinn_model.eval()
                    jac_theory = vmap(jacrev(lambda x: torch.cat(model(x.unsqueeze(0)), dim=-1).squeeze(0)))(sample)
                    jac_pred = vmap(jacrev(pcinn_model))(sample)
                    jac_loss = loss_fn(jac_pred, jac_theory)
                    jac_loss_val = float(jac_loss.detach())
                    total_loss = request.data_weight * data_loss + request.jac_weight * jac_loss
                else:
                    total_loss = data_loss

                pcinn_model.train()
                pcinn_opt.zero_grad(); total_loss.backward(); pcinn_opt.step()
                pcinn_model.eval()
                with torch.no_grad():
                    val_loss = float(loss_fn(pcinn_model(x_test), y_test))
                tl = float(data_loss.detach())
                pcinn_test_losses.append(val_loss)

                if ep % log_every == 0 or ep == request.epochs:
                    yield emit({"type": "progress", "epoch": request.epochs + ep, "train_loss": tl, "val_loss": val_loss,
                                "jac_loss": jac_loss_val if use_jac else None,
                                "log": f"[PCINN] Epoch {ep}/{request.epochs} — train: {tl:.6f} | val: {val_loss:.6f} | jac: {jac_loss_val:.6f}"})

            # Save weights
            out_dir = Path(script_dir) / "models"
            out_dir.mkdir(parents=True, exist_ok=True)
            torch.save(nn_model.state_dict(), out_dir / "nn_model.pt")
            torch.save(pcinn_model.state_dict(), out_dir / "pcinn_model.pt")

            yield emit({"type": "done", "nn_test_loss": nn_test_losses[-1], "pcinn_test_loss": pcinn_test_losses[-1]})

        except Exception as e:
            yield emit({"type": "error", "message": str(e)})

    return StreamingResponse(generate(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting PCINN API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

    