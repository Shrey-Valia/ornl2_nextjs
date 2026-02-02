from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import os

# Initialize FastAPI app
app = FastAPI(title="MMA Solution Model API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
import torch.nn as nn

class MMAModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(5, 128)
        self.fc2 = nn.Linear(128, 128)
        self.fc3 = nn.Linear(128, 64)
        self.Xout = nn.Linear(64, 1)
        self.Mout = nn.Linear(64, 5)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.relu(self.fc3(x))
        x_out = self.Xout(x)
        m_out = self.Mout(x)
        return x_out, m_out

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'MMA_solution_net.pt')

model = MMAModel()
state_dict = torch.load(model_path)
model.load_state_dict(state_dict)
model.eval()

# Define request schema
class PredictionRequest(BaseModel):
    M: float
    S: float
    I: float
    temp: float
    time: float
    Reaction: float

class PredictionResponse(BaseModel):
    input: dict
    x_output: list
    m_output: list

@app.get("/")
def read_root():
    """Root endpoint with API info"""
    return {"message": "MMA Solution Model API", "endpoint": "/predict"}

@app.post("/debug")
async def debug_request(request: Request):
    """Debug endpoint to see raw request body"""
    body = await request.json()
    print(f"DEBUG: Raw request body: {body}")
    return {"received": body}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """
    Run model prediction with input parameters.
    
    Parameters:
    - M: float
    - S: float
    - I: float
    - temp: float (temperature)
    - time: float
    - Reaction: float
    
    Returns dual outputs:
    - x_output: Single value output
    - m_output: Array of 5 values
    """
    print(f"DEBUG: Received request: {request}")
    print(f"DEBUG: Request dict: {request.dict()}")
    
    # Create input tensor from request (use 5 inputs: S, I, temp, time, Reaction)
    input_data = torch.tensor(
        [[request.S, request.I, request.temp, request.time, request.Reaction]],
        dtype=torch.float32
    )
    
    # Run model inference
    with torch.no_grad():
        x_out, m_out = model(input_data)
    
    # Convert outputs to lists
    x_output_list = x_out.cpu().numpy().tolist()[0]
    m_output_list = m_out.cpu().numpy().tolist()[0]
    
    return PredictionResponse(
        input={
            "M": request.M,
            "S": request.S,
            "I": request.I,
            "temp": request.temp,
            "time": request.time,
            "Reaction": request.Reaction
        },
        x_output=x_output_list,
        m_output=m_output_list
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
