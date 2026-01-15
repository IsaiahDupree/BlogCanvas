import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/brand/style-performance?clientId={id}
 * Get performance metrics for all styles used by a client
 *
 * @feat-171 PRD Brand: Data backing for style rules with metrics
 *
 * Response:
 * {
 *   success: boolean;
 *   styles: StylePerformance[];
 *   recommendations: Recommendation[];
 *   summary: {
 *     totalStyles: number;
 *     avgEngagement: number;
 *     topStyle: string;
 *     bottomStyle: string;
 *   };
 * }
 */

interface StylePerformance {
  pattern: string;
  confidence: number;
  avgEngagementScore: number;
  sampleSize: number;
  impact: string;
  rank: number;
  category: 'top' | 'medium' | 'low';
  extractedAt: string;
}

interface Recommendation {
  type: 'optimization' | 'warning' | 'info';
  message: string;
  fromStyle?: string;
  toStyle?: string;
  expectedImprovement?: string;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get clientId from query params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId parameter is required' },
        { status: 400 }
      );
    }

    // Verify client access
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    // Get brand guide with learned styles
    const { data: brandGuide, error: brandError } = await supabase
      .from('brand_guides')
      .select('id, styles_to_keep')
      .eq('brand_name', client.name)
      .single();

    if (brandError || !brandGuide) {
      return NextResponse.json(
        { success: false, error: 'Brand guide not found' },
        { status: 404 }
      );
    }

    // Parse styles_to_keep to get auto-learned styles
    const stylesData = (brandGuide.styles_to_keep as any) || {};
    const autoLearned = stylesData.auto_learned?.patterns || [];

    if (autoLearned.length === 0) {
      return NextResponse.json({
        success: true,
        styles: [],
        recommendations: [{
          type: 'info',
          message: 'Run the "Learn from Top Posts" analysis to generate style performance data.'
        }],
        summary: {
          totalStyles: 0,
          avgEngagement: 0,
          topStyle: null,
          bottomStyle: null
        }
      });
    }

    // Calculate ranks and categorize styles
    const sortedStyles = [...autoLearned].sort((a, b) => b.avgEngagementScore - a.avgEngagementScore);
    const styles: StylePerformance[] = sortedStyles.map((style, index) => {
      const percentile = (index + 1) / sortedStyles.length;
      const category = percentile <= 0.33 ? 'top' : percentile <= 0.67 ? 'medium' : 'low';

      return {
        pattern: style.pattern,
        confidence: style.confidence,
        avgEngagementScore: style.avgEngagementScore,
        sampleSize: style.sampleSize,
        impact: style.impact,
        rank: index + 1,
        category,
        extractedAt: style.extractedAt
      };
    });

    // Generate recommendations
    const recommendations: Recommendation[] = [];
    const avgEngagement = styles.reduce((sum, s) => sum + s.avgEngagementScore, 0) / styles.length;
    const topStyles = styles.filter(s => s.category === 'top');
    const lowStyles = styles.filter(s => s.category === 'low');

    // Optimization: Suggest switching from low to top-performing styles
    if (lowStyles.length > 0 && topStyles.length > 0) {
      const worstStyle = lowStyles[lowStyles.length - 1];
      const bestStyle = topStyles[0];
      const improvement = Math.round(((bestStyle.avgEngagementScore - worstStyle.avgEngagementScore) / worstStyle.avgEngagementScore) * 100);

      recommendations.push({
        type: 'optimization',
        message: `Consider replacing "${worstStyle.pattern}" with "${bestStyle.pattern}" for better engagement`,
        fromStyle: worstStyle.pattern,
        toStyle: bestStyle.pattern,
        expectedImprovement: `+${improvement}%`
      });
    }

    // Warning: Low confidence styles
    const lowConfidenceStyles = styles.filter(s => s.confidence < 30);
    if (lowConfidenceStyles.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${lowConfidenceStyles.length} style(s) have low confidence (<30%). Consider analyzing more posts for better accuracy.`
      });
    }

    // Info: Top performers
    if (topStyles.length > 0) {
      const topPatterns = topStyles.slice(0, 3).map(s => s.pattern).join(', ');
      recommendations.push({
        type: 'info',
        message: `Your top-performing styles: ${topPatterns}`
      });
    }

    // Info: Sample size recommendations
    const lowSampleStyles = styles.filter(s => s.sampleSize < 5);
    if (lowSampleStyles.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${lowSampleStyles.length} style(s) have small sample sizes (<5 posts). Publish more content to improve accuracy.`
      });
    }

    // Build summary
    const summary = {
      totalStyles: styles.length,
      avgEngagement: Math.round(avgEngagement),
      topStyle: topStyles[0]?.pattern || null,
      bottomStyle: lowStyles[lowStyles.length - 1]?.pattern || null
    };

    return NextResponse.json({
      success: true,
      styles,
      recommendations,
      summary
    });

  } catch (error) {
    console.error('Error fetching style performance:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch style performance'
      },
      { status: 500 }
    );
  }
}
