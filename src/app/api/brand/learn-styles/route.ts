import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { learnStylesFromTopPosts, updateBrandGuideWithLearnedStyles } from '@/lib/brand/style-learning';

/**
 * POST /api/brand/learn-styles
 * Analyzes top-performing blog posts for a client and learns writing patterns
 *
 * @feat-170 PRD Brand: Auto-learn styles from top performing posts
 *
 * Request body:
 * {
 *   clientId: string;          // Required: Client UUID
 *   minPosts?: number;         // Optional: Minimum posts to analyze (default: 5)
 *   engagementThreshold?: number; // Optional: Min engagement score (default: 60)
 *   autoUpdate?: boolean;      // Optional: Auto-update brand guide (default: false)
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   learnedStyles: LearnedStyle[];
 *   updated?: boolean;
 *   message?: string;
 * }
 */
export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();
    const {
      clientId,
      minPosts = 5,
      engagementThreshold = 60,
      autoUpdate = false
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId is required' },
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

    // Learn styles from top posts
    console.log(`Learning styles for client ${client.name}...`);
    const learnedStyles = await learnStylesFromTopPosts(
      clientId,
      minPosts,
      engagementThreshold
    );

    if (learnedStyles.length === 0) {
      return NextResponse.json({
        success: true,
        learnedStyles: [],
        message: `No patterns found. Need at least ${minPosts} high-performing posts with engagement score >= ${engagementThreshold}.`
      });
    }

    // Auto-update brand guide if requested
    let updated = false;
    if (autoUpdate) {
      const updateResult = await updateBrandGuideWithLearnedStyles(clientId, learnedStyles);
      if (updateResult.success) {
        updated = true;
      } else {
        console.error('Failed to update brand guide:', updateResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      learnedStyles,
      updated,
      message: `Learned ${learnedStyles.length} patterns from ${learnedStyles[0]?.source || 'analysis'}`
    });

  } catch (error) {
    console.error('Error learning styles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to learn styles'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/brand/learn-styles?clientId={id}
 * Preview learned styles without updating
 */
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

    // Learn styles (preview only)
    const learnedStyles = await learnStylesFromTopPosts(clientId);

    return NextResponse.json({
      success: true,
      learnedStyles,
      message: learnedStyles.length > 0
        ? `Found ${learnedStyles.length} potential patterns`
        : 'No patterns found. Need more high-performing posts.'
    });

  } catch (error) {
    console.error('Error previewing learned styles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to preview styles'
      },
      { status: 500 }
    );
  }
}
