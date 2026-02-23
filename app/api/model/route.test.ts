/**
 * Tests for app/api/model/route.ts — Next.js API route handler
 *
 * Covers:
 *  - Input validation (missing required params → 400)
 *  - Successful proxy to FastAPI backend
 *  - FastAPI error propagation
 *  - Internal error handling (fetch failure → 500)
 *  - Response shape / contract
 *  - Default M=0 when omitted
 */

import { POST } from './route';

// ---------------------------------------------------------------------------
// Polyfill Request/Response for jsdom (not available by default)
// ---------------------------------------------------------------------------
if (typeof globalThis.Request === 'undefined') {
  class MinimalRequest {
    public url: string;
    public method: string;
    public headers: Record<string, string>;
    private _body: string;

    constructor(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
      this.url = url;
      this.method = init.method ?? 'GET';
      this.headers = init.headers ?? {};
      this._body = init.body ?? '';
    }
    async json() { return JSON.parse(this._body); }
    async text() { return this._body; }
  }
  (globalThis as any).Request = MinimalRequest;
}

if (typeof globalThis.Response === 'undefined') {
  // Response.json is used via the global Response in route.ts
  class MinimalResponse {
    public status: number;
    private _body: any;

    constructor(body?: any, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }
    async json() { return typeof this._body === 'string' ? JSON.parse(this._body) : this._body; }

    static json(data: any, init?: { status?: number }) {
      return new MinimalResponse(data, init);
    }
  }
  (globalThis as any).Response = MinimalResponse;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeFetchResponse(body: Record<string, unknown>, ok = true, status = 200, statusText = 'OK') {
  return {
    ok,
    status,
    statusText,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const validBody = {
  M: 0.2,
  S: 1.0,
  I: 0.5,
  temp: 300,
  time: 60,
  Reaction: 3,
  model_type: 'pcinn',
};

const backendSuccess = {
  x_output: [0.85],
  m_output: [4.7, 5.0, 5.18, 5.3, 5.08],
  m_output_log10: [4.7, 5.0, 5.18, 5.3, 5.08],
  model_type: 'pcinn',
  input: validBody,
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

describe('POST /api/model', () => {
  // --- Validation -----------------------------------------------------------

  it('returns 400 when required params are missing', async () => {
    // S, I, temp, time, Reaction are all required
    const incompleteBody = { M: 0.2 };
    const res = await POST(makeRequest(incompleteBody));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toMatch(/Missing required/i);
  });

  it('returns 400 when some required params are missing', async () => {
    const res = await POST(makeRequest({ S: 1, I: 0.5 }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  // --- Successful prediction ------------------------------------------------

  it('proxies to FastAPI backend and returns 200 on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeFetchResponse(backendSuccess));

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Prediction successful');
    expect(json.outputs.x_output).toEqual([0.85]);
    expect(json.outputs.m_output).toEqual([4.7, 5.0, 5.18, 5.3, 5.08]);
    expect(json.outputs.model_type).toBe('pcinn');
  });

  it('defaults M to 0 when not provided', async () => {
    const fetchMock = jest.fn().mockResolvedValue(makeFetchResponse(backendSuccess));
    global.fetch = fetchMock;

    const bodyNoM = { S: 1, I: 0.5, temp: 300, time: 60, Reaction: 3 };
    await POST(makeRequest(bodyNoM));

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.M).toBe(0);
  });

  it('sends correct body to FastAPI', async () => {
    const fetchMock = jest.fn().mockResolvedValue(makeFetchResponse(backendSuccess));
    global.fetch = fetchMock;

    await POST(makeRequest(validBody));

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/predict');
    const sentBody = JSON.parse(options.body);
    expect(sentBody.S).toBe(1.0);
    expect(sentBody.I).toBe(0.5);
    expect(sentBody.temp).toBe(300);
    expect(sentBody.time).toBe(60);
    expect(sentBody.Reaction).toBe(3);
  });

  // --- Error handling -------------------------------------------------------

  it('propagates FastAPI error status', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      makeFetchResponse({}, false, 422, 'Unprocessable Entity'),
    );

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.message).toMatch(/FastAPI request failed/);
  });

  it('returns 500 on fetch/network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Prediction failed');
    expect(json.error).toContain('ECONNREFUSED');
  });

  // --- Response shape -------------------------------------------------------

  it('response includes input echo', async () => {
    const fetchResponse = { ...backendSuccess, input: validBody };
    global.fetch = jest.fn().mockResolvedValue(makeFetchResponse(fetchResponse));

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(json.input).toBeDefined();
  });
});
