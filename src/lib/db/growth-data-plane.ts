import { createClient } from '@/lib/supabase/server';
import type {
  Person,
  Event,
  EmailMessage,
  EmailEvent,
  Subscription,
  PersonFeatures,
  CreatePersonInput,
  CreateEventInput,
  CreateEmailMessageInput,
  CreateEmailEventInput,
  IdentityLink,
} from '@/types/growth-data-plane';

/**
 * Growth Data Plane Database Service
 */

// =============================================
// PERSON
// =============================================

/**
 * Find or create a person by email
 */
export async function findOrCreatePerson(
  input: CreatePersonInput
): Promise<Person | null> {
  const supabase = await createClient();

  // Try to find existing person by email
  if (input.email) {
    const { data: existing } = await supabase
      .from('person')
      .select('*')
      .eq('email', input.email)
      .single();

    if (existing) {
      // Update last_seen_at
      await supabase
        .from('person')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.id);

      return existing;
    }
  }

  // Create new person
  const { data, error } = await supabase
    .from('person')
    .insert({
      ...input,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      lifecycle_stage: 'visitor',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create person:', error);
    return null;
  }

  // Initialize person_features
  await supabase.from('person_features').insert({
    person_id: data.id,
    tenant_id: input.tenant_id,
  });

  return data;
}

/**
 * Get person by ID
 */
export async function getPersonById(personId: string): Promise<Person | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('person')
    .select('*')
    .eq('id', personId)
    .single();

  if (error) {
    console.error('Failed to get person:', error);
    return null;
  }

  return data;
}

/**
 * Update person lifecycle stage
 */
export async function updatePersonLifecycleStage(
  personId: string,
  stage: Person['lifecycle_stage']
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('person')
    .update({ lifecycle_stage: stage })
    .eq('id', personId);

  if (error) {
    console.error('Failed to update lifecycle stage:', error);
    return false;
  }

  return true;
}

// =============================================
// IDENTITY LINKING
// =============================================

/**
 * Link external identity to person
 */
export async function linkIdentity(
  personId: string,
  source: IdentityLink['source'],
  externalId: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('identity_link').insert({
    person_id: personId,
    source,
    external_id: externalId,
    metadata: metadata || {},
  });

  if (error) {
    // Might already exist - that's ok
    if (error.code === '23505') return true;
    console.error('Failed to link identity:', error);
    return false;
  }

  return true;
}

/**
 * Find person by external identity
 */
export async function findPersonByExternalId(
  source: IdentityLink['source'],
  externalId: string
): Promise<Person | null> {
  const supabase = await createClient();

  const { data: link } = await supabase
    .from('identity_link')
    .select('person_id')
    .eq('source', source)
    .eq('external_id', externalId)
    .single();

  if (!link) return null;

  return getPersonById(link.person_id);
}

// =============================================
// EVENTS
// =============================================

/**
 * Track an event
 */
export async function trackEvent(input: CreateEventInput): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event')
    .insert(input)
    .select()
    .single();

  if (error) {
    // Deduplication error - event_id already exists
    if (error.code === '23505') {
      console.log('Event already tracked (deduplication):', input.event_id);
      return null;
    }
    console.error('Failed to track event:', error);
    return null;
  }

  // Asynchronously update person_features
  if (data.person_id) {
    updatePersonFeatures(data.person_id, input.event_name).catch((err) =>
      console.error('Failed to update person features:', err)
    );
  }

  return data;
}

/**
 * Get events for a person
 */
export async function getPersonEvents(
  personId: string,
  limit = 100
): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get person events:', error);
    return [];
  }

  return data || [];
}

/**
 * Update person_features based on event
 */
async function updatePersonFeatures(
  personId: string,
  eventName: string
): Promise<void> {
  const supabase = await createClient();

  // Map event names to feature flags
  const featureUpdates: Record<string, boolean> = {};

  switch (eventName) {
    case 'demo_requested':
      featureUpdates.demo_requested = true;
      break;
    case 'signup_completed':
      featureUpdates.signup_completed = true;
      break;
    case 'first_client_added':
      featureUpdates.first_client_added = true;
      break;
    case 'blog_created':
      featureUpdates.blog_created = true;
      break;
    case 'blog_approved':
      featureUpdates.blog_approved = true;
      break;
    case 'blog_published':
      featureUpdates.blog_published = true;
      break;
    case 'checkout_started':
      featureUpdates.checkout_started = true;
      break;
    case 'purchase_completed':
      featureUpdates.purchase_completed = true;
      break;
  }

  if (Object.keys(featureUpdates).length > 0) {
    await supabase
      .from('person_features')
      .update(featureUpdates)
      .eq('person_id', personId);

    // Also update lifecycle stage
    if (eventName === 'demo_requested') {
      await updatePersonLifecycleStage(personId, 'lead');
    } else if (eventName === 'signup_completed') {
      await updatePersonLifecycleStage(personId, 'signup');
    } else if (eventName === 'first_client_added') {
      await updatePersonLifecycleStage(personId, 'activated');
    } else if (eventName === 'purchase_completed') {
      await updatePersonLifecycleStage(personId, 'paying');
    }
  }
}

// =============================================
// EMAIL TRACKING
// =============================================

/**
 * Log sent email
 */
export async function logEmailSent(
  input: CreateEmailMessageInput
): Promise<EmailMessage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('email_message')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Failed to log email sent:', error);
    return null;
  }

  return data;
}

/**
 * Track email event (opened, clicked, etc.)
 */
export async function trackEmailEvent(
  input: CreateEmailEventInput
): Promise<EmailEvent | null> {
  const supabase = await createClient();

  // Get the email_message record first
  const { data: message } = await supabase
    .from('email_message')
    .select('id')
    .eq('message_id', input.message_id)
    .single();

  if (!message) {
    console.error('Email message not found:', input.message_id);
    return null;
  }

  const { data, error } = await supabase
    .from('email_event')
    .insert({
      ...input,
      message_id: message.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to track email event:', error);
    return null;
  }

  // Update email_message status
  if (input.event_type === 'delivered') {
    await supabase
      .from('email_message')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', message.id);
  } else if (input.event_type === 'bounced') {
    await supabase
      .from('email_message')
      .update({
        status: 'bounced',
        bounced_at: new Date().toISOString(),
      })
      .eq('id', message.id);
  } else if (input.event_type === 'complained') {
    await supabase
      .from('email_message')
      .update({
        status: 'complained',
        complained_at: new Date().toISOString(),
      })
      .eq('id', message.id);
  }

  return data;
}

/**
 * Get email engagement stats for a person
 */
export async function getEmailEngagementStats(
  personId: string
): Promise<{
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  open_rate: number;
  click_rate: number;
}> {
  const supabase = await createClient();

  // Get all messages for person
  const { data: messages } = await supabase
    .from('email_message')
    .select('id')
    .eq('person_id', personId);

  if (!messages || messages.length === 0) {
    return { sent: 0, delivered: 0, opened: 0, clicked: 0, open_rate: 0, click_rate: 0 };
  }

  const messageIds = messages.map((m) => m.id);

  // Get events
  const { data: events } = await supabase
    .from('email_event')
    .select('event_type')
    .in('message_id', messageIds);

  const delivered = events?.filter((e) => e.event_type === 'delivered').length || 0;
  const opened = events?.filter((e) => e.event_type === 'opened').length || 0;
  const clicked = events?.filter((e) => e.event_type === 'clicked').length || 0;

  const open_rate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const click_rate = delivered > 0 ? (clicked / delivered) * 100 : 0;

  return {
    sent: messages.length,
    delivered,
    opened,
    clicked,
    open_rate: Math.round(open_rate * 100) / 100,
    click_rate: Math.round(click_rate * 100) / 100,
  };
}

// =============================================
// SUBSCRIPTION TRACKING
// =============================================

/**
 * Upsert subscription from Stripe webhook
 */
export async function upsertSubscription(
  stripeSubscriptionId: string,
  data: Partial<Subscription>
): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from('subscription')
    .upsert(
      {
        ...data,
        stripe_subscription_id: stripeSubscriptionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to upsert subscription:', error);
    return null;
  }

  return result;
}

/**
 * Get active subscriptions for a person
 */
export async function getActiveSubscriptions(
  personId: string
): Promise<Subscription[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscription')
    .select('*')
    .eq('person_id', personId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get active subscriptions:', error);
    return [];
  }

  return data || [];
}
