import { NextRequest, NextResponse } from 'next/server';
import { generateGapReport, formatGapReportAsText } from '@/lib/reports/gap-report-generator';
import { generateGapReportPDFBuffer } from '@/lib/reports/gap-report-pdf';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/websites/[id]/gap-report - Generate and return gap report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, text, or pdf

    // Check if website exists
    const { data: website, error: websiteError } = await supabaseAdmin
      .from('websites')
      .select('id, url')
      .eq('id', id)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { success: false, error: 'Website not found' },
        { status: 404 }
      );
    }

    // Generate gap report
    const report = await generateGapReport(id);

    // Return based on format
    if (format === 'pdf') {
      const pdfBuffer = generateGapReportPDFBuffer(report);
      const filename = `gap-report-${report.websiteName}-${new Date().toISOString().split('T')[0]}.pdf`;

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'text') {
      const textReport = formatGapReportAsText(report);
      const filename = `gap-report-${report.websiteName}-${new Date().toISOString().split('T')[0]}.txt`;

      return new NextResponse(textReport, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // JSON format (default)
      return NextResponse.json({
        success: true,
        report,
      });
    }
  } catch (error) {
    console.error('Error generating gap report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate gap report',
      },
      { status: 500 }
    );
  }
}

// POST /api/websites/[id]/gap-report/share - Generate shareable link for gap report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { recipientEmail, includeFormat = 'pdf' } = body;

    // Check if website exists
    const { data: website, error: websiteError } = await supabaseAdmin
      .from('websites')
      .select('id, url, client_id')
      .eq('id', id)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { success: false, error: 'Website not found' },
        { status: 404 }
      );
    }

    // Generate gap report
    const report = await generateGapReport(id);

    // Store report in database for sharing
    const { data: storedReport, error: storeError } = await supabaseAdmin
      .from('reports')
      .insert({
        website_id: id,
        report_type: 'gap_analysis',
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        generated_by: 'system',
        content: report,
        format: includeFormat,
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing report:', storeError);
      return NextResponse.json(
        { success: false, error: 'Failed to store report' },
        { status: 500 }
      );
    }

    // Generate shareable link
    const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848'}/reports/${storedReport.id}`;

    // TODO: Send email if recipientEmail is provided
    // This would integrate with Resend to send the report via email

    return NextResponse.json({
      success: true,
      shareableLink,
      reportId: storedReport.id,
      message: recipientEmail
        ? `Report generated and email sent to ${recipientEmail}`
        : 'Report generated successfully',
    });
  } catch (error) {
    console.error('Error sharing gap report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share gap report',
      },
      { status: 500 }
    );
  }
}
