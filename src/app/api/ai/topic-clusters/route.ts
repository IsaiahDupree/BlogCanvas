import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runTopicClusterAgent, generateSEOForecast, TopicClusterInput } from '@/lib/agents/topic-cluster';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      websiteId,
      websiteUrl,
      industry,
      niche,
      targetAudience,
      competitorUrls,
      currentSeoScore,
      targetSeoScore,
      businessGoals,
      generateForecast = true
    } = body;

    if (!industry || !niche) {
      return NextResponse.json({ 
        error: 'Industry and niche are required' 
      }, { status: 400 });
    }

    // Get current topics from website if websiteId provided
    let currentTopics: string[] = [];
    if (websiteId) {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('target_keyword')
        .eq('website_id', websiteId);
      
      if (posts) {
        currentTopics = posts.map(p => p.target_keyword).filter(Boolean);
      }
    }

    const clusterInput: TopicClusterInput = {
      websiteUrl,
      industry,
      niche,
      currentTopics,
      targetAudience: targetAudience || 'Business professionals',
      competitorUrls,
      currentSeoScore: currentSeoScore || 50,
      targetSeoScore: targetSeoScore || 80,
      businessGoals
    };

    // Generate topic clusters
    const clusterResult = await runTopicClusterAgent(clusterInput);

    if (!clusterResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: clusterResult.error 
      }, { status: 500 });
    }

    // Optionally generate SEO forecast
    let forecast = null;
    if (generateForecast && clusterResult.data) {
      const forecastResult = await generateSEOForecast(
        clusterResult.data.clusters,
        currentSeoScore || 50,
        targetSeoScore || 80,
        6
      );
      if (forecastResult.success) {
        forecast = forecastResult.data;
      }
    }

    // Save topic clusters to database if websiteId provided
    if (websiteId && clusterResult.data) {
      for (const cluster of clusterResult.data.clusters) {
        await supabase.from('topic_clusters').upsert({
          website_id: websiteId,
          name: cluster.name,
          primary_keyword: cluster.primaryKeyword,
          estimated_traffic: cluster.estimatedTrafficPotential,
          difficulty: cluster.difficulty,
          currently_covered: cluster.currentlyCovered,
          metadata: {
            pillarTopic: cluster.pillarTopic,
            searchIntent: cluster.searchIntent,
            suggestedArticles: cluster.suggestedArticles,
            relatedKeywords: cluster.relatedKeywords
          }
        }, {
          onConflict: 'website_id,primary_keyword'
        });
      }
    }

    return NextResponse.json({
      success: true,
      clusters: clusterResult.data?.clusters,
      totalArticlesNeeded: clusterResult.data?.totalArticlesNeeded,
      estimatedTrafficGain: clusterResult.data?.estimatedTrafficGain,
      prioritizedTopics: clusterResult.data?.prioritizedTopics,
      gaps: clusterResult.data?.gaps,
      recommendations: clusterResult.data?.recommendations,
      forecast
    });

  } catch (error: any) {
    console.error('Topic cluster generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
