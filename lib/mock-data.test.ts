/**
 * Tests for lib/mock-data.ts — mock data generation
 *
 * Covers:
 *  - Data shape and array lengths
 *  - MWD chart data generation logic (Gaussian distribution)
 *  - Data value range constraints
 *  - Exported data structures
 */

import {
  recentPredictions,
  predictionData,
  mwdChartData,
  chainLengthData,
  experimentalData,
  modelMetrics,
} from './mock-data';

// ---------------------------------------------------------------------------
// recentPredictions
// ---------------------------------------------------------------------------

describe('recentPredictions', () => {
  it('has 10 entries', () => {
    expect(recentPredictions).toHaveLength(10);
  });

  it('each entry has day and value', () => {
    recentPredictions.forEach((entry) => {
      expect(entry).toHaveProperty('day');
      expect(entry).toHaveProperty('value');
      expect(typeof entry.day).toBe('number');
      expect(typeof entry.value).toBe('number');
    });
  });

  it('days are sequential 1–10', () => {
    const days = recentPredictions.map((e) => e.day);
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

// ---------------------------------------------------------------------------
// predictionData
// ---------------------------------------------------------------------------

describe('predictionData', () => {
  it('has 7 entries (one per weekday)', () => {
    expect(predictionData).toHaveLength(7);
  });

  it('each entry has name and predictions count', () => {
    predictionData.forEach((entry) => {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('predictions');
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.predictions).toBe('number');
    });
  });
});

// ---------------------------------------------------------------------------
// mwdChartData — generated Gaussian distribution
// ---------------------------------------------------------------------------

describe('mwdChartData', () => {
  it('has 50 data points', () => {
    expect(mwdChartData).toHaveLength(50);
  });

  it('each data point has mw, predicted, experimental', () => {
    mwdChartData.forEach((point) => {
      expect(point).toHaveProperty('mw');
      expect(point).toHaveProperty('predicted');
      expect(point).toHaveProperty('experimental');
      expect(typeof point.mw).toBe('number');
      expect(typeof point.predicted).toBe('number');
      expect(typeof point.experimental).toBe('number');
    });
  });

  it('molecular weights are positive and increasing', () => {
    for (let i = 1; i < mwdChartData.length; i++) {
      expect(mwdChartData[i].mw).toBeGreaterThan(mwdChartData[i - 1].mw);
    }
  });

  it('predicted values are between 0 and 1 (Gaussian normalized)', () => {
    mwdChartData.forEach((point) => {
      expect(point.predicted).toBeGreaterThanOrEqual(0);
      expect(point.predicted).toBeLessThanOrEqual(1);
    });
  });

  it('peak predicted value is near molecular weight ~100000', () => {
    const peakPoint = mwdChartData.reduce((a, b) =>
      b.predicted > a.predicted ? b : a,
    );
    // Should be within an order of magnitude of 100,000
    expect(peakPoint.mw).toBeGreaterThan(10000);
    expect(peakPoint.mw).toBeLessThan(1000000);
  });
});

// ---------------------------------------------------------------------------
// chainLengthData
// ---------------------------------------------------------------------------

describe('chainLengthData', () => {
  it('has 8 bins', () => {
    expect(chainLengthData).toHaveLength(8);
  });

  it('each entry has length string and count number', () => {
    chainLengthData.forEach((entry) => {
      expect(typeof entry.length).toBe('string');
      expect(typeof entry.count).toBe('number');
      expect(entry.count).toBeGreaterThanOrEqual(0);
    });
  });
});

// ---------------------------------------------------------------------------
// experimentalData
// ---------------------------------------------------------------------------

describe('experimentalData', () => {
  it('has 5 experiments', () => {
    expect(experimentalData).toHaveLength(5);
  });

  it('each experiment has all required fields', () => {
    experimentalData.forEach((exp) => {
      expect(exp).toHaveProperty('id');
      expect(exp).toHaveProperty('temp');
      expect(exp).toHaveProperty('pressure');
      expect(exp).toHaveProperty('time');
      expect(exp).toHaveProperty('monomer');
      expect(exp).toHaveProperty('catalyst');
      expect(exp).toHaveProperty('yield');
    });
  });

  it('yields are between 0 and 100', () => {
    experimentalData.forEach((exp) => {
      expect(exp.yield).toBeGreaterThanOrEqual(0);
      expect(exp.yield).toBeLessThanOrEqual(100);
    });
  });
});

// ---------------------------------------------------------------------------
// modelMetrics
// ---------------------------------------------------------------------------

describe('modelMetrics', () => {
  it('has correct keys', () => {
    expect(modelMetrics).toHaveProperty('r2Score');
    expect(modelMetrics).toHaveProperty('mse');
    expect(modelMetrics).toHaveProperty('mae');
    expect(modelMetrics).toHaveProperty('rmse');
    expect(modelMetrics).toHaveProperty('trainingSamples');
    expect(modelMetrics).toHaveProperty('validationSamples');
    expect(modelMetrics).toHaveProperty('epochs');
    expect(modelMetrics).toHaveProperty('learningRate');
  });

  it('r2Score is between 0 and 1', () => {
    expect(modelMetrics.r2Score).toBeGreaterThanOrEqual(0);
    expect(modelMetrics.r2Score).toBeLessThanOrEqual(1);
  });

  it('error metrics are non-negative', () => {
    expect(modelMetrics.mse).toBeGreaterThanOrEqual(0);
    expect(modelMetrics.mae).toBeGreaterThanOrEqual(0);
    expect(modelMetrics.rmse).toBeGreaterThanOrEqual(0);
  });

  it('RMSE >= MAE (mathematical property)', () => {
    expect(modelMetrics.rmse).toBeGreaterThanOrEqual(modelMetrics.mae);
  });
});
