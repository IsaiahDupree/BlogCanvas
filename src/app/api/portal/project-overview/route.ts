import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client profile to find client_id
    const { data: clientProfile, error: profileError } = await supabase
      .from('client_profiles')
      .select('client_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !clientProfile) {
      return NextResponse.json(
        { error: 'Client profile not found' },
        { status: 404 }
      )
    }

    const clientId = clientProfile.client_id

    // Get client's website(s)
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, url, platform')
      .eq('client_id', clientId)

    if (websitesError) {
      return NextResponse.json(
        { error: 'Failed to fetch websites' },
        { status: 500 }
      )
    }

    if (!websites || websites.length === 0) {
      return NextResponse.json(
        { error: 'No websites found' },
        { status: 404 }
      )
    }

    // For simplicity, use the first website (in production, might want to support multiple)
    const websiteId = websites[0].id

    // Get latest SEO audit for baseline score
    const { data: latestAudit, error: auditError } = await supabase
      .from('seo_audits')
      .select('baseline_score, pages_indexed, audit_date, raw_metrics')
      .eq('website_id', websiteId)
      .order('audit_date', { ascending: false })
      .limit(1)
      .single()

    // Get active content batches to determine target score
    const { data: contentBatches, error: batchesError } = await supabase
      .from('content_batches')
      .select(
        'id, name, goal_score_from, goal_score_to, total_posts, posts_completed, posts_approved, posts_published, status, start_date, end_date'
      )
      .eq('client_id', clientId)
      .in('status', ['planned', 'in_progress'])
      .order('created_at', { ascending: false })

    if (batchesError) {
      console.error('Error fetching content batches:', batchesError)
    }

    // Get all blog posts for this client (across all batches)
    const { data: allPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, status, seo_quality_score, content_batch_id, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }

    // Calculate project metrics
    const baselineScore = latestAudit?.baseline_score || 0
    const targetScore =
      contentBatches && contentBatches.length > 0
        ? contentBatches[0].goal_score_to || baselineScore
        : baselineScore
    const expectedUplift = targetScore - baselineScore

    // Get post counts by status
    const postsNeedingReview = allPosts?.filter(
      (p) => p.status === 'client_review'
    ).length || 0
    const postsApproved = allPosts?.filter(
      (p) => p.status === 'approved'
    ).length || 0
    const postsPublished = allPosts?.filter(
      (p) => p.status === 'published'
    ).length || 0
    const totalPosts = allPosts?.length || 0

    // Get recent posts needing review (limit 5)
    const recentPostsNeedingReview = allPosts
      ?.filter((p) => p.status === 'client_review')
      .slice(0, 5)

    return NextResponse.json({
      website: websites[0],
      seoMetrics: {
        baselineScore,
        targetScore,
        expectedUplift,
        pagesIndexed: latestAudit?.pages_indexed || 0,
        lastAuditDate: latestAudit?.audit_date || null
      },
      contentBatches: contentBatches || [],
      postCounts: {
        needingReview: postsNeedingReview,
        approved: postsApproved,
        published: postsPublished,
        total: totalPosts
      },
      recentPostsNeedingReview: recentPostsNeedingReview || []
    })
  } catch (error) {
    console.error('Error fetching project overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
