/**
 * Tests for lib/model.ts — getModelPrediction logic
 *
 * Covers:
 *  - Successful prediction with correct output mapping
 *  - Legacy field mapping (molecularWeights → molarRatio, flowRate, etc.)
 *  - HTTP error handling
 *  - Network / fetch failure handling
 *  - Request body serialization
 */

import { getModelPrediction, ModelInput, ModelOutput } from './model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validInput: ModelInput = {
  M: 0.2,
  S: 1.0,
  I: 0.5,
  temp: 300,
  time: 60,
  Reaction: 3,
};

function makeFetchResponse(body: Record<string, unknown>, ok = true, statusText = 'OK') {
  return {
    ok,
    statusText,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const sampleBackendResponse = {
  success: true,
  outputs: {
    x_output: [0.85],
    m_output: [4.7, 5.0, 5.18, 5.3, 5.08],
    model_type: 'pcinn',
  },
  input: validInput,
  message: 'Prediction successful',
  warnings: ['test warning'],
  scalers_used: true,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getModelPrediction', () => {
  it('sends a POST request to the correct URL with JSON body', async () => {
    const fetchMock = jest.fn().mockResolvedValue(makeFetchResponse(sampleBackendResponse));
    global.fetch = fetchMock;

    await getModelPrediction(validInput);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/model');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual(validInput);
  });

  it('returns correctly mapped output on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeFetchResponse(sampleBackendResponse));

    const result: ModelOutput = await getModelPrediction(validInput);

    // Core PCINN outputs
    expect(result.conversion).toBe(0.85);
    expect(result.x_output).toEqual([0.85]);
    expect(result.m_output).toEqual([4.7, 5.0, 5.18, 5.3, 5.08]);
    expect(result.warnings).toEqual(['test warning']);
    expect(result.scalersUsed).toBe(true);
    // MW computed from log10 m_output
    expect(result.molecularWeights.Mn).toBeCloseTo(Math.pow(10, 4.7), 0);
    expect(result.molecularWeights.Mw).toBeCloseTo(Math.pow(10, 5.0), 0);
    expect(result.molecularWeights.PDI).toBeCloseTo(Math.pow(10, 5.0) / Math.pow(10, 4.7), 2);
  });

  it('maps legacy fields for backward compatibility', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeFetchResponse(sampleBackendResponse));

    const result = await getModelPrediction(validInput);

    // Legacy mapping defined in model.ts (computed from log10 outputs)
    expect(result.molarRatio).toBeCloseTo(result.molecularWeights.Mn, 0);
    expect(result.flowRate).toBeCloseTo(result.molecularWeights.Mw, 0);
    expect(result.temperature).toBeCloseTo(result.molecularWeights.Mz, 0);
    expect(result.pressure).toBeCloseTo(result.molecularWeights.PDI, 2);
    expect(result.e).toBeCloseTo(result.molecularWeights.Mv, 0);
    expect(result.confidence).toBe(result.conversion);
  });

  it('defaults warnings to empty array when backend omits it', async () => {
    const response = { ...sampleBackendResponse, warnings: undefined };
    global.fetch = jest.fn().mockResolvedValue(makeFetchResponse(response));

    const result = await getModelPrediction(validInput);
    expect(result.warnings).toEqual([]);
  });

  it('throws on non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({}, false, 'Internal Server Error'),
    );

    await expect(getModelPrediction(validInput)).rejects.toThrow(
      'Internal server error during model prediction',
    );
  });

  it('throws on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getModelPrediction(validInput)).rejects.toThrow(
      'Internal server error during model prediction',
    );
  });
});
