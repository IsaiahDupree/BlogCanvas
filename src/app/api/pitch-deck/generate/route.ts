import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PitchDeckGenerator, generatePitchDeckData } from '@/lib/pitch-deck/generator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clientId, 
      websiteId,
      targetScore = 80,
      timelineMonths = 6,
      format = 'pdf' // pdf or json (for preview)
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    // Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get website and audit data
    let audit = { baseline_score: 50, pages_indexed: 0 };
    let websiteUrl = client.website_url || '';

    if (websiteId) {
      const { data: website } = await supabase
        .from('websites')
        .select('*, seo_audits(*)')
        .eq('id', websiteId)
        .single();

      if (website) {
        websiteUrl = website.url || websiteUrl;
        if (website.seo_audits && website.seo_audits.length > 0) {
          const latestAudit = website.seo_audits.sort((a: any, b: any) => 
            new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime()
          )[0];
          audit = {
            baseline_score: latestAudit.baseline_score || 50,
            pages_indexed: latestAudit.pages_indexed || 0
          };
        }
      }
    }

    // Get topic clusters
    const { data: topicClusters } = await supabase
      .from('topic_clusters')
      .select('*')
      .eq('website_id', websiteId || '');

    // Get vendor and user info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, vendor:vendors(*)')
      .eq('id', user.id)
      .single();

    const vendorInfo = {
      name: profile?.vendor?.company_name || 'BlogCanvas',
      csmName: profile?.full_name || user.email?.split('@')[0] || 'Account Manager',
      csmEmail: user.email || ''
    };

    // Generate pitch deck data
    const pitchData = generatePitchDeckData(
      { name: client.name, website_url: websiteUrl },
      audit,
      topicClusters || [],
      vendorInfo,
      targetScore,
      timelineMonths
    );

    // If JSON format requested, return the data for preview
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: pitchData
      });
    }

    // Generate PDF
    const generator = new PitchDeckGenerator();
    const pdfBlob = generator.generate(pitchData);

    // Convert blob to base64
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Log the generation
    await supabase.from('reports').insert({
      website_id: websiteId || null,
      report_type: 'pitch_deck',
      generated_by: user.id,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      storage_url: null // Could store in Supabase Storage if needed
    });

    return NextResponse.json({
      success: true,
      pdf: base64,
      filename: `${client.name.replace(/\s+/g, '_')}_SEO_Pitch_${new Date().toISOString().split('T')[0]}.pdf`,
      data: pitchData
    });

  } catch (error: any) {
    console.error('Pitch deck generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET - Get pitch deck templates/options
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available templates and default settings
    return NextResponse.json({
      success: true,
      templates: [
        { id: 'standard', name: 'Standard SEO Pitch', description: 'Professional pitch deck for SEO content proposals' },
        { id: 'executive', name: 'Executive Summary', description: 'Condensed version for C-level presentations' }
      ],
      defaults: {
        targetScore: 80,
        timelineOptions: [3, 6, 9, 12],
        defaultTimeline: 6
      }
    });

  } catch (error: any) {
    console.error('Get pitch deck options error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
