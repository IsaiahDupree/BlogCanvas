/**
 * User Feedback Collection Service
 * Implements VENDOR-WC-135: User feedback collection
 */

import { supabaseAdmin } from '@/lib/supabase'

export type FeedbackCategory =
  | 'bug'
  | 'feature_request'
  | 'improvement'
  | 'content'
  | 'performance'
  | 'ui_ux'
  | 'other'

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

export interface FeedbackSubmission {
  vendor_id: string
  user_id?: string
  category: FeedbackCategory
  title: string
  description: string
  priority?: FeedbackPriority
  url?: string
  user_agent?: string
  screenshot_url?: string
  metadata?: Record<string, any>
}

/**
 * Submit user feedback
 */
export async function submitFeedback(
  feedback: FeedbackSubmission
): Promise<{ success: boolean; feedback_id?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_feedback')
      .insert({
        vendor_id: feedback.vendor_id,
        user_id: feedback.user_id,
        category: feedback.category,
        title: feedback.title,
        description: feedback.description,
        priority: feedback.priority || 'medium',
        url: feedback.url,
        user_agent: feedback.user_agent,
        screenshot_url: feedback.screenshot_url,
        metadata: feedback.metadata,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error submitting feedback:', error)
      return { success: false, error: error.message }
    }

    return { success: true, feedback_id: data.id }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return { success: false, error: 'Failed to submit feedback' }
  }
}

/**
 * Get feedback for a vendor
 */
export async function getVendorFeedback(
  vendorId: string,
  options?: {
    category?: FeedbackCategory
    status?: 'new' | 'in_progress' | 'resolved' | 'closed'
    limit?: number
  }
): Promise<any[]> {
  let query = supabaseAdmin
    .from('user_feedback')
    .select(`
      id,
      category,
      title,
      description,
      priority,
      status,
      url,
      screenshot_url,
      created_at,
      user:users(email, full_name)
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching feedback:', error)
    return []
  }

  return data || []
}

/**
 * Update feedback status
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'new' | 'in_progress' | 'resolved' | 'closed',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_feedback')
      .update({
        status,
        updated_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('id', feedbackId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating feedback status:', error)
    return { success: false, error: 'Failed to update feedback' }
  }
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(
  vendorId: string,
  days: number = 30
): Promise<{
  total: number
  by_category: Record<FeedbackCategory, number>
  by_priority: Record<FeedbackPriority, number>
  by_status: Record<string, number>
}> {
  const { data, error } = await supabaseAdmin
    .from('user_feedback')
    .select('category, priority, status')
    .eq('vendor_id', vendorId)
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

  if (error || !data) {
    return {
      total: 0,
      by_category: {} as any,
      by_priority: {} as any,
      by_status: {}
    }
  }

  const stats = {
    total: data.length,
    by_category: {} as Record<FeedbackCategory, number>,
    by_priority: {} as Record<FeedbackPriority, number>,
    by_status: {} as Record<string, number>
  }

  data.forEach((item) => {
    // Count by category
    stats.by_category[item.category as FeedbackCategory] =
      (stats.by_category[item.category as FeedbackCategory] || 0) + 1

    // Count by priority
    stats.by_priority[item.priority as FeedbackPriority] =
      (stats.by_priority[item.priority as FeedbackPriority] || 0) + 1

    // Count by status
    stats.by_status[item.status] = (stats.by_status[item.status] || 0) + 1
  })

  return stats
}
