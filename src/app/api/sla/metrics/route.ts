/**
 * SLA Metrics Endpoint
 * GET /api/sla/metrics
 *
 * Returns SLA compliance metrics for the current vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user and vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get vendor_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    if (!profile?.vendor_id) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorId = profile.vendor_id;

    // Get SLA compliance metrics from the view
    const { data: metrics, error: metricsError } = await supabase
      .from('sla_compliance_metrics')
      .select('*')
      .eq('vendor_id', vendorId);

    if (metricsError) {
      console.error('Error fetching SLA metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch SLA metrics' },
        { status: 500 }
      );
    }

    // Get current pending reviews (for live status)
    const { data: pendingReviews, error: pendingError } = await supabase
      .from('review_sla_tracking')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'pending')
      .order('sla_deadline_at', { ascending: true });

    if (pendingError) {
      console.error('Error fetching pending reviews:', pendingError);
    }

    // Calculate real-time metrics
    const now = new Date();
    const pending = pendingReviews || [];

    const activeReviews = pending.length;
    const approachingDeadline = pending.filter(r => {
      const deadline = new Date(r.sla_deadline_at);
      const threshold = new Date(r.alert_threshold_at);
      return now >= threshold && now < deadline;
    }).length;
    const breached = pending.filter(r => {
      const deadline = new Date(r.sla_deadline_at);
      return now > deadline;
    }).length;

    // Organize metrics by type
    const editorMetrics = metrics?.find(m => m.sla_type === 'editor_review') || {
      total_reviews: 0,
      completed_reviews: 0,
      breached_reviews: 0,
      compliant_reviews: 0,
      compliance_rate: 100,
      avg_review_duration_hours: 0,
      current_breaches: 0,
      approaching_deadline: 0
    };

    const clientMetrics = metrics?.find(m => m.sla_type === 'client_review') || {
      total_reviews: 0,
      completed_reviews: 0,
      breached_reviews: 0,
      compliant_reviews: 0,
      compliance_rate: 100,
      avg_review_duration_hours: 0,
      current_breaches: 0,
      approaching_deadline: 0
    };

    return NextResponse.json({
      success: true,
      vendorId,
      summary: {
        activeReviews,
        approachingDeadline,
        breached,
        onTrack: activeReviews - approachingDeadline - breached
      },
      editorReview: {
        slaHours: 24,
        totalReviews: editorMetrics.total_reviews,
        completedReviews: editorMetrics.completed_reviews,
        breachedReviews: editorMetrics.breached_reviews,
        compliantReviews: editorMetrics.compliant_reviews,
        complianceRate: parseFloat(editorMetrics.compliance_rate || '100'),
        avgReviewDuration: parseFloat(editorMetrics.avg_review_duration_hours || '0'),
        currentBreaches: editorMetrics.current_breaches,
        approachingDeadline: editorMetrics.approaching_deadline
      },
      clientReview: {
        slaHours: 72,
        totalReviews: clientMetrics.total_reviews,
        completedReviews: clientMetrics.completed_reviews,
        breachedReviews: clientMetrics.breached_reviews,
        compliantReviews: clientMetrics.compliant_reviews,
        complianceRate: parseFloat(clientMetrics.compliance_rate || '100'),
        avgReviewDuration: parseFloat(clientMetrics.avg_review_duration_hours || '0'),
        currentBreaches: clientMetrics.current_breaches,
        approachingDeadline: clientMetrics.approaching_deadline
      },
      pendingReviews: pending.map(r => ({
        id: r.id,
        blogPostId: r.blog_post_id,
        slaType: r.sla_type,
        submittedAt: r.submitted_at,
        deadline: r.sla_deadline_at,
        alertThreshold: r.alert_threshold_at,
        status: r.status,
        hoursRemaining: Math.round(
          (new Date(r.sla_deadline_at).getTime() - now.getTime()) / (1000 * 60 * 60)
        ),
        isApproachingDeadline: now >= new Date(r.alert_threshold_at) && now < new Date(r.sla_deadline_at),
        isBreached: now > new Date(r.sla_deadline_at)
      }))
    });

  } catch (error: any) {
    console.error('SLA metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
