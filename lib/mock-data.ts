// Mock data for dashboard charts
export const recentPredictions = [
  { day: 1, value: 12 },
  { day: 2, value: 19 },
  { day: 3, value: 15 },
  { day: 4, value: 22 },
  { day: 5, value: 18 },
  { day: 6, value: 25 },
  { day: 7, value: 28 },
  { day: 8, value: 24 },
  { day: 9, value: 30 },
  { day: 10, value: 27 },
];

export const predictionData = [
  { name: 'Mon', predictions: 12 },
  { name: 'Tue', predictions: 19 },
  { name: 'Wed', predictions: 15 },
  { name: 'Thu', predictions: 22 },
  { name: 'Fri', predictions: 18 },
  { name: 'Sat', predictions: 8 },
  { name: 'Sun', predictions: 5 },
];

export const mwdChartData = Array.from({ length: 50 }, (_, i) => {
  const mw = Math.pow(10, 2 + i * 0.08);
  const peak = 100000;
  const sigma = 0.5;
  const logMw = Math.log10(mw);
  const logPeak = Math.log10(peak);
  const predicted = Math.exp(-Math.pow(logMw - logPeak, 2) / (2 * sigma * sigma));
  const experimental = predicted * (0.9 + Math.random() * 0.2);
  
  return {
    mw: Math.round(mw),
    predicted: Number(predicted.toFixed(4)),
    experimental: Number(experimental.toFixed(4)),
  };
});

export const chainLengthData = [
  { length: '0-50', count: 120 },
  { length: '50-100', count: 280 },
  { length: '100-150', count: 450 },
  { length: '150-200', count: 380 },
  { length: '200-250', count: 220 },
  { length: '250-300', count: 150 },
  { length: '300-350', count: 80 },
  { length: '350+', count: 40 },
];

export const experimentalData = [
  { id: 1, temp: 120, pressure: 2.5, time: 60, monomer: 0.5, catalyst: 0.01, yield: 85.2 },
  { id: 2, temp: 130, pressure: 3.0, time: 45, monomer: 0.6, catalyst: 0.015, yield: 88.7 },
  { id: 3, temp: 125, pressure: 2.8, time: 55, monomer: 0.55, catalyst: 0.012, yield: 86.9 },
  { id: 4, temp: 135, pressure: 3.2, time: 50, monomer: 0.65, catalyst: 0.018, yield: 91.2 },
  { id: 5, temp: 115, pressure: 2.2, time: 70, monomer: 0.45, catalyst: 0.008, yield: 82.1 },
];

export const modelMetrics = {
  r2Score: 0.943,
  mse: 0.0023,
  mae: 0.038,
  rmse: 0.048,
  trainingSamples: 45,
  validationSamples: 12,
  epochs: 500,
  learningRate: 0.001,
};
export const trainingData = Array.from({ length: 50 }, (_, i) => ({
  epoch: i + 1,
  training: 0.5 * Math.exp(-i * 0.05) + 0.02 + Math.random() * 0.02,
  validation: 0.55 * Math.exp(-i * 0.045) + 0.025 + Math.random() * 0.03,
}));

export const errorDistribution = [
  { range: '0-1%', count: 15 },
  { range: '1-2%', count: 22 },
  { range: '2-3%', count: 18 },
  { range: '3-4%', count: 12 },
  { range: '4-5%', count: 8 },
  { range: '5%+', count: 5 },
];