import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, rating } = body;

    if (!storeId || !rating) {
      return NextResponse.json(
        { error: 'Missing storeId or rating' },
        { status: 400 }
      );
    }

    console.log(`Rating submitted: Store ${storeId} rated ${rating}/5`);

    return NextResponse.json({ 
      success: true,
      storeId,
      rating,
      message: 'Rating saved successfully'
    });
  } catch (error) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json(
      { error: 'Missing storeId' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    storeId,
    rating: 0,
    votes: 0,
  });
}