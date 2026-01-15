import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runTopicClusterAgent, generateSEOForecast, TopicClusterInput } from '@/lib/agents/topic-cluster';
import { getSharedClientContext, formatContextForAI } from '@/lib/brand/shared-context';

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
      generateForecast = true,
      clientId // NEW: Accept clientId to pull brand context
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

    // Get brand context if clientId provided
    let brandContext = null;
    let enhancedTargetAudience = targetAudience || 'Business professionals';
    let enhancedBusinessGoals = businessGoals;

    if (clientId) {
      try {
        brandContext = await getSharedClientContext(clientId);

        // Enhance target audience from brand context
        if (brandContext.targetAudiences.length > 0) {
          enhancedTargetAudience = brandContext.targetAudiences
            .map((ta: any) => ta.name || ta.description)
            .join(', ');
        }

        // Enhance business goals with value propositions
        if (brandContext.valuePropositions.length > 0) {
          const valueProps = brandContext.valuePropositions.join('; ');
          enhancedBusinessGoals = enhancedBusinessGoals
            ? `${enhancedBusinessGoals}. Value propositions: ${valueProps}`
            : `Value propositions: ${valueProps}`;
        }
      } catch (error) {
        console.error('Failed to fetch brand context for topic generation:', error);
        // Continue with provided values if context fetch fails
      }
    }

    const clusterInput: TopicClusterInput = {
      websiteUrl,
      industry,
      niche,
      currentTopics,
      targetAudience: enhancedTargetAudience,
      competitorUrls,
      currentSeoScore: currentSeoScore || 50,
      targetSeoScore: targetSeoScore || 80,
      businessGoals: enhancedBusinessGoals
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
