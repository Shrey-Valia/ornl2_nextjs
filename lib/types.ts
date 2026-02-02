// Experiment data types
export interface Experiment {
  id: string;
  date: string;
  reactor: 'Batch' | 'Flow';
  monomer: number;
  temp: number;
  status: 'Valid' | 'Invalid';
}

// Prediction types
export interface PredictionResult {
  id: string;
  timestamp: Date;
  predictedYield: number;
  confidence: number;
  conditions: ReactionConditions;
}

export interface ReactionConditions {
  monomerConc: number;
  initiatorConc: number;
  temperature: number;
  reactionTime: number;
  propagationRate?: number;
  terminationRate?: number;
}

// Chart data types
export interface ChartDataPoint {
  x: number;
  y: number;
}

export interface MWDData {
  molecularWeight: number[];
  weightFraction: number[];
}

// Model performance metrics
export interface PerformanceMetrics {
  r2Score: number;
  mae: number;
  rmse: number;
  confidence: number;
  totalPredictions: number;
  accuracy: number;
}