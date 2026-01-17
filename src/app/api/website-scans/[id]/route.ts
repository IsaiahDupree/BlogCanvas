import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get a specific scan result
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: scanId } = await params;
    const supabase = await createClient();

    const { data: scan, error } = await supabase
      .from('website_scans')
      .select(`
        *,
        websites (
          id,
          url,
          name,
          client_id,
          clients (
            id,
            name,
            company_name
          )
        )
      `)
      .eq('id', scanId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json({ scan });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scan
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: scanId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('website_scans')
      .delete()
      .eq('id', scanId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scan:', error);
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    );
  }
}
