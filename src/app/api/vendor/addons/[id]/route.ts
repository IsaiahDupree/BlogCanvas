import { NextRequest, NextResponse } from 'next/server';
import { getAddonById, updateAddon, deleteAddon } from '@/lib/db/vendor/addons';
import type { OfferAddonUpdateInput } from '@/types/offer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const addon = await getAddonById(params.id);

    if (!addon) {
      return NextResponse.json(
        { error: 'Add-on not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('Error fetching addon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addon' },
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
    const input: OfferAddonUpdateInput = body;

    const addon = await updateAddon(params.id, input);

    if (!addon) {
      return NextResponse.json(
        { error: 'Add-on not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('Error updating addon:', error);
    return NextResponse.json(
      { error: 'Failed to update addon' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteAddon(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete addon' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting addon:', error);
    return NextResponse.json(
      { error: 'Failed to delete addon' },
      { status: 500 }
    );
  }
}
