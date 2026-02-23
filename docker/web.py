from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import os

# Initialize FastAPI app
app = FastAPI(title="MMA PCINN Model API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# DomainModel - PCINN "Theory Network" (matches MMA_PCINN.py exactly)
# =============================================================================
class DomainModel(nn.Module):
    """
    Physics-Constrained/Informed Neural Network for MMA polymerization.
    This is the "Theory network" from MMA_PCINN.py
    
    Outputs:
    - X: Conversion (0-1, sigmoid activation)
    - Mn, Mw, Mz, Mz+1, Mv: Molecular weights (log10 scale, softplus activation)
    """
    def __init__(self):
        super(DomainModel, self).__init__()
        self.fc1 = nn.Linear(5, 128)
        self.fc2 = nn.Linear(128, 128)
        self.fc3 = nn.Linear(128, 64)
        self.Xout = nn.Linear(64, 1)   # Conversion output
        self.Mout = nn.Linear(64, 5)   # Mn, Mw, Mz, Mz+1, Mv

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.relu(self.fc3(x))
        
        X_out = F.sigmoid(self.Xout(x))    # Conversion (0-1)
        M_out = F.softplus(self.Mout(x))   # MW values (positive, log10 scale)
        
        return X_out, M_out


# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# =============================================================================
# Load Scalers for Input Normalization (CRITICAL for PCINN!)
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
        print(f"   Expected: {scalerx_max_path}")
        print(f"   Expected: {scalerx_min_path}")
except Exception as e:
    print(f"⚠️ Error loading scalers: {e}")


def normalize_input(x: np.ndarray) -> np.ndarray:
    """Normalize input features to [0, 1] range using training scalers."""
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
    M: float      # Monomer concentration [M] (mol/L)
    S: float      # Solvent concentration [S] (mol/L)
    I: float      # Initiator concentration [I] (mol/L)
    temp: float   # Temperature (K)
    time: float   # Reaction time (seconds)
    Reaction: float  # Reaction identifier (for tracking)

class PredictionResponse(BaseModel):
    success: bool
    input: dict
    # Raw model outputs (log10 scale for MW)
    x_output: list    # Conversion (0-1)
    m_output: list    # [log10(Mn), log10(Mw), log10(Mz), log10(Mz+1), log10(Mv)]
    # Processed outputs (actual values)
    conversion: float           # X (0-1, fraction converted)
    molecular_weights: dict     # Actual MW values (not log scale)
    scalers_used: bool
    warnings: list = []


# =============================================================================
# API Endpoints
# =============================================================================
@app.get("/")
def read_root():
    """Root endpoint with API info"""
    return {
        "message": "MMA PCINN Model API",
        "version": "2.0.0",
        "scalers_loaded": scalers_loaded,
        "endpoints": {
            "/predict": "POST - Run PCINN prediction",
            "/health": "GET - Health check"
        },
        "inputs": ["M (monomer)", "S (solvent)", "I (initiator)", "temp (K)", "time (s)"],
        "outputs": ["X (conversion)", "Mn", "Mw", "Mz", "Mz+1", "Mv"]
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": True,
        "scalers_loaded": scalers_loaded
    }


@app.post("/debug")
async def debug_request(request: Request):
    """Debug endpoint to see raw request body"""
    body = await request.json()
    print(f"DEBUG: Raw request body: {body}")
    return {"received": body}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """
    Run PCINN prediction for MMA polymerization.
    
    Inputs (5 features, normalized internally):
    - M: Monomer concentration [M] (mol/L)
    - S: Solvent concentration [S] (mol/L)  
    - I: Initiator concentration [I] (mol/L)
    - temp: Temperature (K)
    - time: Reaction time (seconds)
    
    Outputs:
    - X: Conversion (0-1, fraction of monomer converted)
    - Mn: Number average molecular weight (g/mol)
    - Mw: Weight average molecular weight (g/mol)
    - Mz: Z-average molecular weight (g/mol)
    - Mz+1: Z+1 average molecular weight (g/mol)
    - Mv: Viscosity average molecular weight (g/mol)
    """
    warnings = []
    
    # Validate inputs
    if request.M < 0 or request.S < 0 or request.I < 0:
        warnings.append("Negative concentrations detected - results may be invalid")
    if request.temp < 273 or request.temp > 500:
        warnings.append(f"Temperature {request.temp}K outside typical range (273-500K)")
    if request.time < 0:
        warnings.append("Negative time is not physical")
    
    # Create input array: [M, S, I, temp, time]
    # Note: Model uses 5 inputs, Reaction is just for tracking
    raw_input = np.array([[
        request.M,
        request.S,
        request.I,
        request.temp,
        request.time
    ]], dtype=np.float32)
    
    # Normalize inputs (CRITICAL for PCINN accuracy!)
    normalized_input = normalize_input(raw_input)
    
    if not scalers_loaded:
        warnings.append("Scalers not loaded - using raw inputs (predictions may be inaccurate)")
    
    # Convert to tensor
    input_tensor = torch.tensor(normalized_input, dtype=torch.float32)
    
    # Run model inference
    with torch.no_grad():
        x_out, m_out = model(input_tensor)
    
    # Extract outputs
    x_output = x_out.cpu().numpy().tolist()[0]  # Conversion (already 0-1 from sigmoid)
    m_output = m_out.cpu().numpy().tolist()[0]  # MW values (log10 scale from softplus)
    
    # Convert conversion to scalar
    conversion = float(x_output) if isinstance(x_output, (int, float)) else float(x_output[0])
    
    # Convert MW from log10 scale to actual values
    # Model outputs: [log10(Mn), log10(Mw), log10(Mz), log10(Mz+1), log10(Mv)]
    molecular_weights = {
        "Mn": float(10 ** m_output[0]),       # Number average MW
        "Mw": float(10 ** m_output[1]),       # Weight average MW
        "Mz": float(10 ** m_output[2]),       # Z-average MW
        "Mz_plus1": float(10 ** m_output[3]), # Z+1 average MW
        "Mv": float(10 ** m_output[4]),       # Viscosity average MW
        "PDI": float(10 ** m_output[1]) / float(10 ** m_output[0])  # Polydispersity index (Mw/Mn)
    }
    
    return PredictionResponse(
        success=True,
        input={
            "M": request.M,
            "S": request.S,
            "I": request.I,
            "temp": request.temp,
            "time": request.time,
            "Reaction": request.Reaction
        },
        x_output=x_output if isinstance(x_output, list) else [x_output],
        m_output=m_output,
        conversion=conversion,
        molecular_weights=molecular_weights,
        scalers_used=scalers_loaded,
        warnings=warnings
    )


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting PCINN API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
