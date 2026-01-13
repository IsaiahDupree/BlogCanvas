/**
 * GDPR Data Export Service
 *
 * Aggregates all user data from the database for GDPR compliance
 * Supports export in JSON and CSV formats
 */

import { createClient } from '@supabase/supabase-js';

export interface UserDataExport {
  exportDate: string;
  userId: string;
  userEmail?: string;
  profile?: any;
  clients?: any[];
  blogPosts?: any[];
  comments?: any[];
  reviewTasks?: any[];
  agentRuns?: any[];
  files?: any[];
  fileVersions?: any[];
  fileShares?: any[];
  websites?: any[];
  brandGuides?: any[];
  contentBatches?: any[];
  seoAudits?: any[];
  topicClusters?: any[];
  cmsConnections?: any[];
  reports?: any[];
  checkBackSchedules?: any[];
  newsletters?: any[];
  newsletterCampaigns?: any[];
  newsletterRecipients?: any[];
  subscriptions?: any[];
  invoices?: any[];
  apiKeys?: any[];
  webhooks?: any[];
  workDeclarations?: any[];
  auditLogs?: any[];
  vendors?: any[];
  emailMessages?: any[];
  gmailConnections?: any[];
}

/**
 * Export all user data from the database
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );

  const exportDate = new Date().toISOString();

  // Get user auth data
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError) {
    throw new Error(`Failed to get user: ${userError.message}`);
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Get clients (where user is owner)
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', userId);

  const clientIds = clients?.map(c => c.id) || [];

  // Get blog posts for user's clients
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .in('client_id', clientIds);

  const blogPostIds = blogPosts?.map(p => p.id) || [];

  // Get comments by user
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('user_id', userId);

  // Get review tasks assigned to user
  const { data: reviewTasks } = await supabase
    .from('review_tasks')
    .select('*')
    .eq('assigned_to', userId);

  // Get agent runs for user's blog posts
  const { data: agentRuns } = await supabase
    .from('agent_runs')
    .select('*')
    .in('blog_post_id', blogPostIds);

  // Get files owned by user
  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('uploaded_by', userId);

  const fileIds = files?.map(f => f.id) || [];

  // Get file versions for user's files
  const { data: fileVersions } = await supabase
    .from('file_versions')
    .select('*')
    .in('file_id', fileIds);

  // Get file shares for user (as owner or shared with)
  const { data: fileShares } = await supabase
    .from('file_shares')
    .select('*')
    .or(`file_id.in.(${fileIds.join(',')}),shared_with_user_id.eq.${userId})`);

  // Get websites for user's clients
  const { data: websites } = await supabase
    .from('websites')
    .select('*')
    .in('client_id', clientIds);

  const websiteIds = websites?.map(w => w.id) || [];

  // Get brand guides for user's clients
  const { data: brandGuides } = await supabase
    .from('brand_guides')
    .select('*')
    .in('client_id', clientIds);

  // Get content batches for user's clients
  const { data: contentBatches } = await supabase
    .from('content_batches')
    .select('*')
    .in('client_id', clientIds);

  // Get SEO audits for user's websites
  const { data: seoAudits } = await supabase
    .from('seo_audits')
    .select('*')
    .in('website_id', websiteIds);

  // Get topic clusters for user's websites
  const { data: topicClusters } = await supabase
    .from('topic_clusters')
    .select('*')
    .in('website_id', websiteIds);

  // Get CMS connections for user's clients
  const { data: cmsConnections } = await supabase
    .from('cms_connections')
    .select('*')
    .in('client_id', clientIds);

  // Get reports for user's clients
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .in('client_id', clientIds);

  // Get check-back schedules for user's blog posts
  const { data: checkBackSchedules } = await supabase
    .from('check_back_schedules')
    .select('*')
    .in('blog_post_id', blogPostIds);

  // Get newsletter templates owned by user
  const { data: newsletters } = await supabase
    .from('newsletter_templates')
    .select('*')
    .eq('created_by', userId);

  // Get newsletter campaigns created by user
  const { data: newsletterCampaigns } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('created_by', userId);

  // Get newsletter recipients where user is recipient
  const { data: newsletterRecipients } = await supabase
    .from('newsletter_recipients')
    .select('*')
    .eq('email', user?.email);

  // Get vendors where user is owner
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', userId);

  const vendorIds = vendors?.map(v => v.id) || [];

  // Get subscriptions for user's vendors
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .in('vendor_id', vendorIds);

  // Get invoices for user's vendors
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .in('vendor_id', vendorIds);

  // Get API keys for user
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId);

  // Get webhooks for user's vendors
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .in('vendor_id', vendorIds);

  // Get work declarations for user's clients
  const { data: workDeclarations } = await supabase
    .from('work_declarations')
    .select('*')
    .in('client_id', clientIds);

  // Get audit logs for user
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .limit(1000); // Limit to last 1000 entries

  // Get email messages for user
  const { data: emailMessages } = await supabase
    .from('email_messages')
    .select('*')
    .or(`from_email.eq.${user?.email},to_email.eq.${user?.email}`);

  // Get Gmail connections for user
  const { data: gmailConnections } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', userId);

  return {
    exportDate,
    userId,
    userEmail: user?.email,
    profile,
    clients,
    blogPosts,
    comments,
    reviewTasks,
    agentRuns,
    files,
    fileVersions,
    fileShares,
    websites,
    brandGuides,
    contentBatches,
    seoAudits,
    topicClusters,
    cmsConnections,
    reports,
    checkBackSchedules,
    newsletters,
    newsletterCampaigns,
    newsletterRecipients,
    subscriptions,
    invoices,
    apiKeys,
    webhooks,
    workDeclarations,
    auditLogs,
    vendors,
    emailMessages,
    gmailConnections,
  };
}

/**
 * Convert user data to CSV format
 */
export function convertToCSV(data: UserDataExport): string {
  const lines: string[] = [];

  // Header
  lines.push('Category,ID,Data');

  // Profile
  if (data.profile) {
    lines.push(`Profile,${data.profile.id},"${JSON.stringify(data.profile).replace(/"/g, '""')}"`);
  }

  // Add each category
  const categories = [
    'clients', 'blogPosts', 'comments', 'reviewTasks', 'agentRuns',
    'files', 'fileVersions', 'fileShares', 'websites', 'brandGuides',
    'contentBatches', 'seoAudits', 'topicClusters', 'cmsConnections',
    'reports', 'checkBackSchedules', 'newsletters', 'newsletterCampaigns',
    'newsletterRecipients', 'subscriptions', 'invoices', 'apiKeys',
    'webhooks', 'workDeclarations', 'auditLogs', 'vendors',
    'emailMessages', 'gmailConnections'
  ];

  for (const category of categories) {
    const items = (data as any)[category];
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const id = item.id || '';
        const json = JSON.stringify(item).replace(/"/g, '""');
        lines.push(`${category},${id},"${json}"`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Delete all user data (GDPR right to deletion)
 * This cascades through all related records
 */
export async function deleteUserData(userId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );

  // Get all clients owned by user
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('owner_id', userId);

  const clientIds = clients?.map(c => c.id) || [];

  // Get all vendors owned by user
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', userId);

  const vendorIds = vendors?.map(v => v.id) || [];

  // Delete in correct order (children first due to foreign key constraints)

  // 1. Delete comments
  await supabase.from('comments').delete().eq('user_id', userId);

  // 2. Delete review tasks
  await supabase.from('review_tasks').delete().eq('assigned_to', userId);

  // 3. Delete file shares (as shared user)
  await supabase.from('file_shares').delete().eq('shared_with_user_id', userId);

  // 4. Delete files (CASCADE will handle versions)
  await supabase.from('files').delete().eq('uploaded_by', userId);

  // 5. Delete API keys
  await supabase.from('api_keys').delete().eq('user_id', userId);

  // 6. Delete Gmail connections
  await supabase.from('gmail_connections').delete().eq('user_id', userId);

  // 7. Delete newsletter templates
  await supabase.from('newsletter_templates').delete().eq('created_by', userId);

  // 8. Delete newsletter campaigns (CASCADE will handle recipients)
  await supabase.from('newsletter_campaigns').delete().eq('created_by', userId);

  // 9. Delete clients (CASCADE will handle related data)
  if (clientIds.length > 0) {
    await supabase.from('clients').delete().in('id', clientIds);
  }

  // 10. Delete vendors (CASCADE will handle related data)
  if (vendorIds.length > 0) {
    await supabase.from('vendors').delete().in('id', vendorIds);
  }

  // 11. Delete profile
  await supabase.from('profiles').delete().eq('id', userId);

  // 12. Delete auth user (this is the final step)
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
