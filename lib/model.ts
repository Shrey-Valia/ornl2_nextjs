export type ModelInput = {
  M: number;
  S: number;
  I: number;
  temp: number;
  time: number;
  Reaction: number;
};

export type ModelOutput = {
  molarRatio: number;
  flowRate: number;
  temperature: number;
  pressure: number;
  e: number;
  confidence: number;
};

// ============================================
// CONFIGURATION
// Set to false when your backend is running
// ============================================
const USE_MOCK = true;
const API_URL = 'http://localhost:8000/predict';

/**
 * Generates realistic mock predictions based on input parameters
 */
function generateMockPrediction(input: ModelInput): ModelOutput {
  // Create deterministic but varied outputs based on inputs
  const { M, S, I, temp, time, Reaction } = input;
  
  // Molar ratio influenced by monomer/solvent ratio
  const molarRatio = (M / (S + 0.01)) * (0.8 + Math.random() * 0.4);
  
  // Flow rate based on initiator and time
  const flowRate = (I * time * 0.005) * (0.9 + Math.random() * 0.2);
  
  // Temperature output close to input with some variation
  const temperature = temp * (0.98 + Math.random() * 0.04);
  
  // Pressure calculated from reaction conditions
  const pressure = (M * temp * Reaction) / (S + 1) * 0.001 * (0.9 + Math.random() * 0.2);
  
  // Energy term
  const e = (Reaction * I * 0.1) * (0.8 + Math.random() * 0.4);
  
  // Confidence based on how "normal" the inputs are
  const normalizedTemp = Math.abs(temp - 300) / 100;
  const normalizedTime = Math.abs(time - 60) / 60;
  const confidence = Math.max(0.7, Math.min(0.98, 0.95 - normalizedTemp * 0.1 - normalizedTime * 0.05 + Math.random() * 0.05));

  return {
    molarRatio: Number(molarRatio.toFixed(6)),
    flowRate: Number(flowRate.toFixed(6)),
    temperature: Number(temperature.toFixed(2)),
    pressure: Number(pressure.toFixed(4)),
    e: Number(e.toFixed(6)),
    confidence: Number(confidence.toFixed(4)),
  };
}

export async function getModelPrediction(input: ModelInput): Promise<ModelOutput> {
  // Use mock data for development when backend isn't running
  if (USE_MOCK) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    
    console.log('🧪 Mock prediction for:', input);
    const result = generateMockPrediction(input);
    console.log('📊 Mock result:', result);
    
    return result;
  }

  // Real API call to backend
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Model prediction failed: ${response.statusText}`);
    }

    const data = await response.json();
    const [molarRatio, flowRate, temperature, pressure, e] = data.m_output;
    const [confidence] = data.x_output;
    
    return {
      molarRatio,
      flowRate,
      temperature,
      pressure,
      e,
      confidence,
    };
  } catch (error) {
    console.error('Error during model prediction:', error);
    throw new Error('Failed to connect to prediction server. Is the backend running on localhost:8000?');
  }
}