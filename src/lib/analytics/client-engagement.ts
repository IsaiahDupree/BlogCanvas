// Client Engagement Analytics Utilities

export interface EngagementMetrics {
  portal_visits: number;
  messages_sent: number;
  forms_submitted: number;
  deliverables_viewed: number;
  engagement_score: number;
}

export interface ClientEngagementData {
  client_id: string;
  client_name?: string;
  client_email: string;
  workspace_id?: string;
  week_start: string;
  metrics: EngagementMetrics;
}

/**
 * Calculate engagement score based on activity
 * Score is 0-100 based on:
 * - Portal visits: 2 points each, max 20
 * - Messages sent: 10 points each, max 30
 * - Forms submitted: 20 points each, max 40
 * - Deliverables viewed: 2 points each, max 10
 */
export function calculateEngagementScore(metrics: Omit<EngagementMetrics, 'engagement_score'>): number {
  let score = 0;

  // Portal visits: 2 points each, max 20
  score += Math.min(metrics.portal_visits * 2, 20);

  // Messages sent: 10 points each, max 30
  score += Math.min(metrics.messages_sent * 10, 30);

  // Forms submitted: 20 points each, max 40
  score += Math.min(metrics.forms_submitted * 20, 40);

  // Deliverables viewed: 2 points each, max 10
  score += Math.min(metrics.deliverables_viewed * 2, 10);

  return Math.min(score, 100);
}

/**
 * Get the start of the current week (Monday)
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Get engagement level from score
 */
export function getEngagementLevel(score: number): {
  level: 'low' | 'medium' | 'high';
  label: string;
  color: string;
} {
  if (score >= 70) {
    return {
      level: 'high',
      label: 'Highly Engaged',
      color: 'green'
    };
  } else if (score >= 40) {
    return {
      level: 'medium',
      label: 'Moderately Engaged',
      color: 'yellow'
    };
  } else {
    return {
      level: 'low',
      label: 'Low Engagement',
      color: 'red'
    };
  }
}

/**
 * Format engagement metrics for display
 */
export function formatEngagementMetrics(metrics: EngagementMetrics): {
  label: string;
  value: number | string;
  icon: string;
}[] {
  return [
    {
      label: 'Portal Visits',
      value: metrics.portal_visits,
      icon: 'eye'
    },
    {
      label: 'Messages Sent',
      value: metrics.messages_sent,
      icon: 'message'
    },
    {
      label: 'Forms Submitted',
      value: metrics.forms_submitted,
      icon: 'file'
    },
    {
      label: 'Deliverables Viewed',
      value: metrics.deliverables_viewed,
      icon: 'download'
    },
    {
      label: 'Engagement Score',
      value: `${metrics.engagement_score}/100`,
      icon: 'chart'
    }
  ];
}
