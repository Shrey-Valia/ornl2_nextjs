import { NextRequest, NextResponse } from 'next/server';
import { getAllPredictions, savePrediction, deleteAllPredictions, getStatistics } from '@/lib/db';

// GET /api/predictions - Get all predictions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = getStatistics();
      return NextResponse.json(stats);
    }

    const predictions = getAllPredictions();
    return NextResponse.json(predictions);
  } catch (error) {
    console.error('GET /api/predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

// POST /api/predictions - Save new prediction
export async function POST(request: NextRequest) {
  try {
    const prediction = await request.json();

    // Validate required fields
    if (!prediction.id || !prediction.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = savePrediction(prediction);

    if (success) {
      return NextResponse.json(
        { message: 'Prediction saved', id: prediction.id },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to save prediction' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to save prediction' },
      { status: 500 }
    );
  }
}

// DELETE /api/predictions - Delete all predictions
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const confirmDelete = searchParams.get('confirm') === 'true';

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Confirmation required' },
        { status: 400 }
      );
    }

    const success = deleteAllPredictions();

    if (success) {
      return NextResponse.json({ message: 'All predictions deleted' });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete predictions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to delete predictions' },
      { status: 500 }
    );
  }
}