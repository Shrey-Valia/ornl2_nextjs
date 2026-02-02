import { Experiment, PerformanceMetrics } from './types';

export const mockExperiments: Experiment[] = [
  { id: 'EXP-2024-001', date: '2024-01-15', reactor: 'Batch', monomer: 2.5, temp: 70, status: 'Valid' },
  { id: 'EXP-2024-002', date: '2024-01-16', reactor: 'Batch', monomer: 3.0, temp: 75, status: 'Valid' },
  { id: 'EXP-2024-003', date: '2024-01-17', reactor: 'Batch', monomer: 2.0, temp: 65, status: 'Invalid' },
  { id: 'EXP-2024-004', date: '2024-01-18', reactor: 'Batch', monomer: 2.8, temp: 72, status: 'Valid' },
  { id: 'EXP-2024-005', date: '2024-01-19', reactor: 'Batch', monomer: 3.2, temp: 78, status: 'Valid' },
];

export const mockPerformanceMetrics: PerformanceMetrics = {
  r2Score: 0.943,
  mae: 0.032,
  rmse: 0.045,
  confidence: 0.912,
  totalPredictions: 156,
  accuracy: 94.3,
};

export const recentPredictions = [
  { name: 'Day 1', value: 85 },
  { name: 'Day 2', value: 92 },
  { name: 'Day 3', value: 78 },
  { name: 'Day 4', value: 88 },
  { name: 'Day 5', value: 95 },
];

export const predictionData = [
  { name: 'Jan', predictions: 12 },
  { name: 'Feb', predictions: 19 },
  { name: 'Mar', predictions: 15 },
  { name: 'Apr', predictions: 25 },
  { name: 'May', predictions: 22 },
  { name: 'Jun', predictions: 30 },
];

export const miniGraphData = [
  { x: 1, y: 0.2 },
  { x: 2, y: 0.5 },
  { x: 3, y: 0.8 },
  { x: 4, y: 0.6 },
  { x: 5, y: 0.3 },
];

export const trainingData = [
  { epoch: 0, training: 0.8, validation: 0.85 },
  { epoch: 20, training: 0.45, validation: 0.48 },
  { epoch: 40, training: 0.28, validation: 0.32 },
  { epoch: 60, training: 0.18, validation: 0.25 },
  { epoch: 80, training: 0.12, validation: 0.22 },
  { epoch: 100, training: 0.08, validation: 0.20 },
];

export const errorDistribution = [
  { range: '0-0.01', count: 12 },
  { range: '0.01-0.02', count: 18 },
  { range: '0.02-0.05', count: 10 },
  { range: '0.05-0.1', count: 4 },
  { range: '>0.1', count: 1 },
];

export const chainLengthData = [
  { length: '0-1k', count: 120 },
  { length: '1-5k', count: 450 },
  { length: '5-10k', count: 680 },
  { length: '10-50k', count: 920 },
  { length: '50-100k', count: 340 },
  { length: '>100k', count: 85 },
];

export const mwdChartData = [
  { mw: 1000, predicted: 0.05, experimental: 0.06 },
  { mw: 5000, predicted: 0.15, experimental: 0.14 },
  { mw: 10000, predicted: 0.28, experimental: 0.30 },
  { mw: 20000, predicted: 0.45, experimental: 0.43 },
  { mw: 50000, predicted: 0.38, experimental: 0.40 },
  { mw: 100000, predicted: 0.22, experimental: 0.20 },
  { mw: 200000, predicted: 0.10, experimental: 0.12 },
  { mw: 500000, predicted: 0.03, experimental: 0.02 },
];