import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PitchDeckGenerator, generatePitchDeckData } from '@/lib/pitch-deck/generator';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      recipientEmail,
      recipientName,
      customMessage
    } = body;

    if (!clientId || !recipientEmail) {
      return NextResponse.json({ 
        error: 'clientId and recipientEmail are required' 
      }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please set RESEND_API_KEY.' 
      }, { status: 500 });
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

    // Generate PDF
    const generator = new PitchDeckGenerator();
    const pdfBlob = generator.generate(pitchData);
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Build email content
    const emailSubject = `SEO Content Strategy Proposal for ${client.name}`;
    const filename = `${client.name.replace(/\s+/g, '_')}_SEO_Pitch.pdf`;

    const defaultMessage = `
Hi ${recipientName || 'there'},

I hope this email finds you well. I've put together an SEO content strategy proposal for ${client.name} based on our analysis of your current website performance.

**Key Highlights:**
- Current SEO Score: ${pitchData.currentSeoScore}/100
- Target SEO Score: ${pitchData.targetSeoScore}/100
- Recommended: ${pitchData.recommendedPosts} blog posts over ${pitchData.timelineMonths} months
- Projected Traffic Increase: +${pitchData.projectedTrafficIncrease}%

The attached PDF contains our full proposal including:
- Current state analysis
- Content gap opportunities
- Detailed recommendations
- Expected results
- Next steps

I'd love to schedule a call to walk you through the proposal and answer any questions you might have.

Best regards,
${vendorInfo.csmName}
${vendorInfo.name}
    `.trim();

    // Send email with PDF attachment
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${vendorInfo.name} <noreply@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
      to: recipientEmail,
      subject: emailSubject,
      text: customMessage || defaultMessage,
      attachments: [
        {
          filename,
          content: pdfBuffer
        }
      ]
    });

    if (emailError) {
      throw new Error(emailError.message);
    }

    // Log the email send
    await supabase.from('reports').insert({
      website_id: websiteId || null,
      report_type: 'pitch_deck_email',
      generated_by: user.id,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      storage_url: null
    });

    return NextResponse.json({
      success: true,
      emailId: emailResult?.id,
      message: `Pitch deck sent to ${recipientEmail}`
    });

  } catch (error: any) {
    console.error('Email pitch deck error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
