import { NextRequest, NextResponse } from 'next/server';
import { getPrediction, deletePrediction } from '@/lib/db';

// GET /api/predictions/[id] - Get single prediction
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const prediction = getPrediction(id);

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('GET /api/predictions/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction' },
      { status: 500 }
    );
  }
}

// DELETE /api/predictions/[id] - Delete specific prediction
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const success = deletePrediction(id);

    if (success) {
      return NextResponse.json({ message: 'Prediction deleted' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete prediction' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/predictions/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prediction' },
      { status: 500 }
    );
  }
}