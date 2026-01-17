import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanWebsite, ScanConfig, ScanResult } from '@/lib/services/website-scanner';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get scan history for a website
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: websiteId } = await params;
    const supabase = await createClient();

    const { data: scans, error } = await supabase
      .from('website_scans')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    );
  }
}

// POST - Start a new website scan
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: websiteId } = await params;
    const body = await request.json();
    const { scanType = 'full', maxPages = 50, maxDepth = 3 } = body;

    const supabase = await createClient();

    // Get website URL
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('url, client_id')
      .eq('id', websiteId)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Create scan record
    const { data: scan, error: createError } = await supabase
      .from('website_scans')
      .insert({
        website_id: websiteId,
        url: website.url,
        scan_type: scanType,
        max_pages: maxPages,
        max_depth: maxDepth,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // Start scan in background (don't await)
    runScanInBackground(scan.id, website.url, {
      maxPages,
      maxDepth,
      scanType,
    });

    return NextResponse.json({
      message: 'Scan started',
      scanId: scan.id,
      status: 'running',
    });
  } catch (error) {
    console.error('Error starting scan:', error);
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    );
  }
}

async function runScanInBackground(
  scanId: string,
  url: string,
  config: Partial<ScanConfig>
) {
  const supabase = await createClient();

  try {
    // Get Browserbase API key from env if available
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;

    const result: ScanResult = await scanWebsite({
      url,
      ...config,
      browserbaseApiKey,
    });

    // Update scan record with results
    await supabase
      .from('website_scans')
      .update({
        status: 'completed',
        pages_scanned: result.pagesScanned,
        text_content: result.textContent,
        schema_markup: result.schemaMarkup,
        images: result.images,
        site_metadata: result.siteMetadata,
        internal_links: result.internalLinks,
        external_links: result.externalLinks,
        content_analysis: result.contentAnalysis,
        seo_elements: result.seoElements,
        errors: result.errors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

  } catch (error) {
    // Update scan with error status
    await supabase
      .from('website_scans')
      .update({
        status: 'failed',
        errors: [{
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }],
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);
  }
}
