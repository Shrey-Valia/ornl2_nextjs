from __future__ import annotations

import os
from typing import List, Literal

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    M: float = Field(..., description="Monomer concentration")
    S: float = Field(..., description="Solvent concentration")
    I: float = Field(..., description="Initiator concentration")
    temp: float = Field(..., description="Temperature (K)")
    time: float = Field(..., description="Reaction time (s)")
    Reaction: float | None = Field(None, description="Reaction id (unused in inference)")
    model_type: Literal["pcinn", "nn"] = "pcinn"


class PredictResponse(BaseModel):
    x_output: List[float]
    m_output: List[float]
    m_output_log10: List[float]
    model_type: str
    input: dict


class NNModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = torch.nn.Linear(5, 128)
        self.fc2 = torch.nn.Linear(128, 64)
        self.fc3 = torch.nn.Linear(64, 6)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.tanh(self.fc1(x))
        x = torch.tanh(self.fc2(x))
        x = self.fc3(x)
        return x


def _scale_features(x: np.ndarray, scaler_min: np.ndarray, scaler_max: np.ndarray) -> np.ndarray:
    return (x - scaler_min) / (scaler_max - scaler_min)


def _load_model(weights_path: str) -> NNModel:
    model = NNModel()
    model.load_state_dict(torch.load(weights_path, map_location="cpu"))
    model.eval()
    return model


app = FastAPI(title="PCINN Backend", version="0.2.0")


@app.on_event("startup")
def _load_assets():
    app.state.device = "cpu"
    torch.set_num_threads(1)

    app.state.scalerx_min = np.load("scalerx_min.npy").astype(np.float32)
    app.state.scalerx_max = np.load("scalerx_max.npy").astype(np.float32)

    model_dir = os.getenv("MODEL_DIR", "models")
    app.state.nn_model_path = os.path.join(model_dir, "nn_model.pt")
    app.state.pcinn_model_path = os.path.join(model_dir, "pcinn_model.pt")

    app.state.nn_model = None
    app.state.pcinn_model = None

    if os.path.isfile(app.state.nn_model_path):
        app.state.nn_model = _load_model(app.state.nn_model_path)

    if os.path.isfile(app.state.pcinn_model_path):
        app.state.pcinn_model = _load_model(app.state.pcinn_model_path)


@app.get("/health")
def health():
    return {
        "ok": True,
        "nn_loaded": app.state.nn_model is not None,
        "pcinn_loaded": app.state.pcinn_model is not None,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    model_type = payload.model_type
    model = app.state.pcinn_model if model_type == "pcinn" else app.state.nn_model

    if model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model weights not loaded for '{model_type}'. Run training and place weights in {os.getenv('MODEL_DIR', 'models')}/.",
        )

    try:
        x_raw = np.array([[payload.M, payload.S, payload.I, payload.temp, payload.time]], dtype=np.float32)
        x_scaled = _scale_features(x_raw, app.state.scalerx_min, app.state.scalerx_max)

        x_tensor = torch.from_numpy(x_scaled).to(app.state.device)
        with torch.no_grad():
            out = model(x_tensor).cpu().numpy()[0]

        # Model outputs: [X, Mn, Mw, Mz, Mzplus1, Mv]
        x_output = [float(out[0])]
        m_output_log10 = [float(v) for v in out[1:]]
        m_output = [float(10 ** v) for v in out[1:]]

        return {
            "x_output": x_output,
            "m_output": m_output,
            "m_output_log10": m_output_log10,
            "model_type": model_type,
            "input": payload.model_dump(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
