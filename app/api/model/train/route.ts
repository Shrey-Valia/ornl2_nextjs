import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const UPLOAD_DIR = path.join(process.cwd(), 'data-uploads');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, config } = body;

    if (!file) {
      return new Response(JSON.stringify({ message: 'Missing file name' }), { status: 400 });
    }

    const safeName = path.basename(file).replace(/[^a-zA-Z0-9._-]/g, '_');
    const csvPath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({ message: `File not found: ${safeName}` }), { status: 404 });
    }

    // Read CSV contents and send directly to FastAPI instead of file path
    const csvContent = fs.readFileSync(csvPath, 'utf8');

    const fastApiResponse = await fetch(`${FASTAPI_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv_content: csvContent,
        epochs: config.epochs ?? 1000,
        lr: config.learningRate ?? 0.0003,
        data_weight: config.dataWeight ?? 1.0,
        jac_weight: config.jacWeight ?? 1.0,
        test_reaction: config.testReaction ?? 8,
        jac_samples: 32,
      }),
    });

    if (!fastApiResponse.ok) {
      const err = await fastApiResponse.text();
      return new Response(
        JSON.stringify({ type: 'error', message: `FastAPI error: ${err}` }),
        { status: fastApiResponse.status }
      );
    }

    return new Response(fastApiResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ type: 'error', message: String(error) }),
      { status: 500 }
    );
  }
}
