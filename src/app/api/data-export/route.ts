/**
 * Data Export API
 * POST /api/data-export - Request data export
 * GET /api/data-export?export_id=xxx - Check export status
 *
 * GDPR Article 20: Right to data portability
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  requestDataExport,
  getExportStatus,
  generateDataExport,
  ExportFormat,
} from '@/lib/data-export-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { format = 'json', immediate = false } = body;

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be: json or csv' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (immediate) {
      // Generate export immediately and return (for small datasets)
      const result = await generateDataExport(supabaseUrl, supabaseServiceKey, {
        user_id: user.id,
        format: format as ExportFormat,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to generate export' },
          { status: 500 }
        );
      }

      // Return the data directly
      const contentType =
        format === 'json' ? 'application/json' : 'text/csv';
      const filename =
        format === 'json'
          ? 'blogcanvas-export.json'
          : 'blogcanvas-export.csv';

      return new NextResponse(result.data, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Queue export for background processing (for large datasets)
      const result = await requestDataExport(
        supabaseUrl,
        supabaseServiceKey,
        user.id,
        user.email!,
        format as ExportFormat
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to request export' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        export_id: result.export_id,
        message:
          'Export request created. You will receive an email when your export is ready.',
      });
    }
  } catch (error: any) {
    console.error('Error handling data export request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process export request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get('export_id');

    if (!exportId) {
      // List all export requests for user
      const { data: exports, error } = await supabase
        .from('data_export_requests')
        .select('id, format, status, requested_at, completed_at, download_url')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return NextResponse.json({ exports: exports || [] });
    } else {
      // Get specific export status
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      const status = await getExportStatus(
        supabaseUrl,
        supabaseServiceKey,
        exportId
      );

      return NextResponse.json(status);
    }
  } catch (error: any) {
    console.error('Error fetching export status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch export status' },
      { status: 500 }
    );
  }
}
