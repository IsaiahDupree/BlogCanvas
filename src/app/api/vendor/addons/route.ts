import { NextRequest, NextResponse } from 'next/server';
import { createAddon, getOfferAddons } from '@/lib/db/vendor/addons';
import type { OfferAddonCreateInput } from '@/types/offer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId');

    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    const addons = await getOfferAddons(offerId);
    return NextResponse.json({ addons });
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input: OfferAddonCreateInput = body;

    // Validate required fields
    if (!input.offer_id || !input.vendor_id || !input.name || !input.addon_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const addon = await createAddon(input);
    return NextResponse.json({ addon }, { status: 201 });
  } catch (error) {
    console.error('Error creating addon:', error);
    return NextResponse.json(
      { error: 'Failed to create addon' },
      { status: 500 }
    );
  }
}
