import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runHeadlineAgent, compareHeadlines } from '@/lib/agents/headline';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      topic,
      targetKeyword,
      contentType = 'blog',
      tone,
      targetAudience,
      currentHeadline,
      variationCount = 10,
      compareWith
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // If compareWith is provided, do A/B comparison
    if (compareWith && currentHeadline) {
      const comparisonResult = await compareHeadlines(
        currentHeadline,
        compareWith,
        targetKeyword || topic
      );

      return NextResponse.json({
        success: comparisonResult.success,
        comparison: comparisonResult.data,
        error: comparisonResult.error
      });
    }

    // Generate headline variations
    const result = await runHeadlineAgent({
      topic,
      targetKeyword: targetKeyword || topic,
      contentType,
      tone,
      targetAudience,
      currentHeadline,
      variationCount
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      variations: result.data?.variations,
      recommended: result.data?.recommended,
      bestForSEO: result.data?.bestForSEO,
      bestForCTR: result.data?.bestForCTR,
      tips: result.data?.tips
    });

  } catch (error: any) {
    console.error('Headline generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
