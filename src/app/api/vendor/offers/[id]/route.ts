import { NextRequest, NextResponse } from 'next/server';
import { getOfferById, updateOffer, deleteOffer } from '@/lib/db/vendor/offers';
import type { OfferUpdateInput } from '@/types/offer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offer = await getOfferById(params.id);

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const input: OfferUpdateInput = body;

    const offer = await updateOffer(params.id, input);

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteOffer(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete offer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
