import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runTopicClusterAgent, generateSEOForecast } from '@/lib/agents/topic-cluster';
import { runPitchGenerator, PitchInput } from '@/lib/agents/pitch-generator';

export const maxDuration = 180;

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
      clientName,
      websiteUrl,
      industry,
      niche,
      targetAudience,
      currentSeoScore = 50,
      targetSeoScore = 80,
      postsPerMonth = 8,
      timelineMonths = 6,
      priceRange,
      csmName,
      companyName = 'BlogCanvas',
      generateClusters = true
    } = body;

    if (!clientName || !industry) {
      return NextResponse.json({ 
        error: 'Client name and industry are required' 
      }, { status: 400 });
    }

    // Get client info if clientId provided
    let clientData = null;
    if (clientId) {
      const { data } = await supabase
        .from('clients')
        .select('*, websites(*)')
        .eq('id', clientId)
        .single();
      clientData = data;
    }

    // Generate topic clusters if requested
    let clusters: any[] = [];
    let forecast: any = null;

    if (generateClusters) {
      const clusterResult = await runTopicClusterAgent({
        websiteUrl: websiteUrl || clientData?.websites?.[0]?.url,
        industry,
        niche: niche || industry,
        targetAudience: targetAudience || 'Business professionals',
        currentSeoScore,
        targetSeoScore,
        businessGoals: ['Increase organic traffic', 'Generate more leads']
      });

      if (clusterResult.success && clusterResult.data) {
        clusters = clusterResult.data.clusters;

        // Generate forecast
        const forecastResult = await generateSEOForecast(
          clusters,
          currentSeoScore,
          targetSeoScore,
          timelineMonths
        );

        if (forecastResult.success) {
          forecast = forecastResult.data;
        }
      }
    }

    // Generate pitch proposal
    const pitchInput: PitchInput = {
      clientName: clientName || clientData?.name || 'Client',
      websiteUrl: websiteUrl || clientData?.websites?.[0]?.url || 'website.com',
      industry,
      currentSeoScore,
      targetSeoScore,
      clusters,
      forecast: forecast || undefined,
      customPackageOptions: {
        postsPerMonth,
        timelineMonths,
        priceRange
      },
      csmName,
      companyName
    };

    const pitchResult = await runPitchGenerator(pitchInput);

    if (!pitchResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: pitchResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pitch: pitchResult.data,
      clusters: clusters.length > 0 ? clusters : undefined,
      forecast
    });

  } catch (error: any) {
    console.error('Pitch generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
