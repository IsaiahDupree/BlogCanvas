/**
 * Data Retention Policies
 * Automated cleanup of old data while preserving audit trails
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Retention periods by data type (in days)
 */
export const RETENTION_PERIODS = {
  // Analytics data
  analytics_events: 90,          // 3 months
  funnel_events: 180,            // 6 months
  page_views: 90,                // 3 months
  session_data: 30,              // 1 month

  // Logs and debugging
  error_logs: 30,                // 1 month
  api_logs: 14,                  // 2 weeks
  webhook_logs: 30,              // 1 month

  // User activity
  login_history: 365,            // 1 year
  activity_logs: 180,            // 6 months

  // Experiments
  experiment_assignments: 365,   // 1 year
  experiment_conversions: 365,   // 1 year

  // Email and notifications
  email_logs: 90,                // 3 months
  notification_history: 30,      // 1 month

  // Soft-deleted items
  deleted_items: 30,             // 1 month before permanent deletion

  // NEVER delete (audit trail)
  audit_logs: -1,                // Keep forever
  financial_transactions: -1,    // Keep forever
  client_data: -1,               // Keep forever
  vendor_data: -1,               // Keep forever
};

/**
 * Tables excluded from automatic cleanup
 */
export const EXCLUDED_TABLES = [
  'audit_logs',
  'transactions',
  'invoices',
  'payments',
  'clients',
  'vendors',
  'users',
  'subscriptions',
  'blog_posts',
  'websites',
];

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  table: string;
  retention_days: number;
  date_column: string;
  soft_delete?: boolean;
  archive_before_delete?: boolean;
}

/**
 * Get all retention policies
 */
export function getRetentionPolicies(): RetentionPolicy[] {
  return [
    {
      table: 'analytics_events',
      retention_days: RETENTION_PERIODS.analytics_events,
      date_column: 'created_at',
      archive_before_delete: true,
    },
    {
      table: 'funnel_events',
      retention_days: RETENTION_PERIODS.funnel_events,
      date_column: 'created_at',
      archive_before_delete: true,
    },
    {
      table: 'page_views',
      retention_days: RETENTION_PERIODS.page_views,
      date_column: 'viewed_at',
      archive_before_delete: false,
    },
    {
      table: 'error_logs',
      retention_days: RETENTION_PERIODS.error_logs,
      date_column: 'created_at',
      archive_before_delete: false,
    },
    {
      table: 'api_logs',
      retention_days: RETENTION_PERIODS.api_logs,
      date_column: 'created_at',
      archive_before_delete: false,
    },
    {
      table: 'webhook_logs',
      retention_days: RETENTION_PERIODS.webhook_logs,
      date_column: 'created_at',
      archive_before_delete: false,
    },
    {
      table: 'login_history',
      retention_days: RETENTION_PERIODS.login_history,
      date_column: 'logged_in_at',
      archive_before_delete: true,
    },
    {
      table: 'email_logs',
      retention_days: RETENTION_PERIODS.email_logs,
      date_column: 'sent_at',
      archive_before_delete: false,
    },
    {
      table: 'notification_history',
      retention_days: RETENTION_PERIODS.notification_history,
      date_column: 'created_at',
      archive_before_delete: false,
    },
  ];
}

/**
 * Archive old data before deletion
 */
async function archiveData(
  table: string,
  cutoffDate: string
): Promise<number> {
  try {
    // Select data to archive
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .lt('created_at', cutoffDate);

    if (error) {
      console.error(`Error selecting data for archive from ${table}:`, error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Insert into archive table
    const archiveTable = `${table}_archive`;
    const { error: archiveError } = await supabase
      .from(archiveTable)
      .insert(data.map(row => ({
        ...row,
        archived_at: new Date().toISOString(),
      })));

    if (archiveError) {
      console.error(`Error archiving data to ${archiveTable}:`, archiveError);
      return 0;
    }

    return data.length;
  } catch (error) {
    console.error(`Error in archiveData for ${table}:`, error);
    return 0;
  }
}

/**
 * Delete old data based on retention policy
 */
async function deleteOldData(
  table: string,
  dateColumn: string,
  cutoffDate: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .lt(dateColumn, cutoffDate)
      .select();

    if (error) {
      console.error(`Error deleting old data from ${table}:`, error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error(`Error in deleteOldData for ${table}:`, error);
    return 0;
  }
}

/**
 * Apply a single retention policy
 */
export async function applyRetentionPolicy(
  policy: RetentionPolicy
): Promise<{ archived: number; deleted: number }> {
  if (EXCLUDED_TABLES.includes(policy.table)) {
    console.log(`Table ${policy.table} is excluded from retention policy`);
    return { archived: 0, deleted: 0 };
  }

  if (policy.retention_days === -1) {
    console.log(`Table ${policy.table} has infinite retention`);
    return { archived: 0, deleted: 0 };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);
  const cutoffDateStr = cutoffDate.toISOString();

  let archived = 0;
  let deleted = 0;

  // Archive if configured
  if (policy.archive_before_delete) {
    archived = await archiveData(policy.table, cutoffDateStr);
    console.log(`Archived ${archived} rows from ${policy.table}`);
  }

  // Delete old data
  deleted = await deleteOldData(policy.table, policy.date_column, cutoffDateStr);
  console.log(`Deleted ${deleted} rows from ${policy.table}`);

  // Log retention action
  await supabase.from('retention_logs').insert({
    table_name: policy.table,
    retention_days: policy.retention_days,
    cutoff_date: cutoffDateStr,
    rows_archived: archived,
    rows_deleted: deleted,
    executed_at: new Date().toISOString(),
  });

  return { archived, deleted };
}

/**
 * Apply all retention policies
 */
export async function applyAllRetentionPolicies(): Promise<{
  totalArchived: number;
  totalDeleted: number;
  results: Array<{ table: string; archived: number; deleted: number }>;
}> {
  const policies = getRetentionPolicies();
  const results: Array<{ table: string; archived: number; deleted: number }> = [];

  let totalArchived = 0;
  let totalDeleted = 0;

  for (const policy of policies) {
    try {
      const result = await applyRetentionPolicy(policy);
      results.push({
        table: policy.table,
        archived: result.archived,
        deleted: result.deleted,
      });
      totalArchived += result.archived;
      totalDeleted += result.deleted;
    } catch (error) {
      console.error(`Error applying retention policy for ${policy.table}:`, error);
    }
  }

  console.log(`Retention cleanup complete: ${totalArchived} archived, ${totalDeleted} deleted`);

  return { totalArchived, totalDeleted, results };
}

/**
 * Get retention statistics
 */
export async function getRetentionStats(): Promise<
  Array<{
    table: string;
    total_rows: number;
    old_rows: number;
    retention_days: number;
  }>
> {
  const policies = getRetentionPolicies();
  const stats: Array<{
    table: string;
    total_rows: number;
    old_rows: number;
    retention_days: number;
  }> = [];

  for (const policy of policies) {
    try {
      // Count total rows
      const { count: totalCount } = await supabase
        .from(policy.table)
        .select('*', { count: 'exact', head: true });

      // Count old rows that would be deleted
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

      const { count: oldCount } = await supabase
        .from(policy.table)
        .select('*', { count: 'exact', head: true })
        .lt(policy.date_column, cutoffDate.toISOString());

      stats.push({
        table: policy.table,
        total_rows: totalCount || 0,
        old_rows: oldCount || 0,
        retention_days: policy.retention_days,
      });
    } catch (error) {
      console.error(`Error getting retention stats for ${policy.table}:`, error);
    }
  }

  return stats;
}

/**
 * Manually trigger retention cleanup (for testing)
 */
export async function triggerRetentionCleanup(): Promise<void> {
  console.log('Starting manual retention cleanup...');
  const result = await applyAllRetentionPolicies();
  console.log('Cleanup result:', result);
}
