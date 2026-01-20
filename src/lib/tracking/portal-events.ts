// Client portal event tracking utilities

import type { TrackEventInput } from '@/types/analytics';

/**
 * Track portal view event
 */
export async function trackPortalView(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'client_portal_view',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        url: window.location.href,
        pathname: window.location.pathname
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track portal view:', err));
}

/**
 * Track onboarding step completed
 */
export async function trackOnboardingStepCompleted(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  stepId: string,
  stepName: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'onboarding_step_completed',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        step_id: stepId,
        step_name: stepName
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track onboarding step:', err));
}

/**
 * Track form submission
 */
export async function trackFormSubmitted(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  formId: string,
  formName: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'form_submitted',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        form_id: formId,
        form_name: formName
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track form submission:', err));
}

/**
 * Track message sent
 */
export async function trackMessageSent(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  messageId: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'message_sent',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        message_id: messageId
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track message sent:', err));
}

/**
 * Track revision requested
 */
export async function trackRevisionRequested(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  revisionId: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'revision_requested',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        revision_id: revisionId
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track revision requested:', err));
}

/**
 * Track deliverable viewed
 */
export async function trackDeliverableViewed(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  deliverableId: string,
  deliverableName: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'deliverable_viewed',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        deliverable_id: deliverableId,
        deliverable_name: deliverableName
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track deliverable viewed:', err));
}

/**
 * Track meeting join link clicked
 */
export async function trackMeetingJoinClicked(
  vendorId: string,
  workspaceId: string,
  clientId: string,
  meetingId: string,
  userId?: string
): Promise<void> {
  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: 'meeting_join_link_clicked',
      event_type: 'portal',
      vendor_id: vendorId,
      workspace_id: workspaceId,
      client_id: clientId,
      user_id: userId,
      user_type: 'client',
      properties: {
        meeting_id: meetingId
      }
    } as TrackEventInput)
  }).catch(err => console.error('Failed to track meeting join:', err));
}
