/**
 * Error Rate Monitoring
 * Tracks and analyzes error rates across the application
 */

import { createClient } from '@/lib/supabase/client';
import { captureMessage } from './sentry';

export interface ErrorMetric {
  id: string;
  endpoint: string;
  error_type: string;
  error_message: string;
  status_code?: number;
  user_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ErrorRateStats {
  totalErrors: number;
  errorRate: number; // Percentage
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Log an error for monitoring
 */
export async function logError(
  endpoint: string,
  errorType: string,
  errorMessage: string,
  options?: {
    statusCode?: number;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from('error_logs').insert({
      endpoint,
      error_type: errorType,
      error_message: errorMessage,
      status_code: options?.statusCode,
      user_id: options?.userId,
      metadata: options?.metadata || {},
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log error:', error);
    }
  } catch (err) {
    console.error('Error logging error:', err);
  }
}

/**
 * Get error rate statistics for a time range
 */
export async function getErrorRateStats(
  startDate: Date,
  endDate: Date,
  endpoint?: string
): Promise<ErrorRateStats> {
  const supabase = createClient();

  // Build query
  let errorQuery = supabase
    .from('error_logs')
    .select('*')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (endpoint) {
    errorQuery = errorQuery.eq('endpoint', endpoint);
  }

  const { data: errors, error } = await errorQuery;

  if (error) {
    console.error('Failed to get error stats:', error);
    return {
      totalErrors: 0,
      errorRate: 0,
      errorsByType: {},
      errorsByEndpoint: {},
      timeRange: { start: startDate, end: endDate },
    };
  }

  // Get total requests in the same time range (from analytics_events)
  let requestQuery = supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  const { count: totalRequests } = await requestQuery;

  // Calculate statistics
  const totalErrors = errors?.length || 0;
  const errorRate = totalRequests ? (totalErrors / totalRequests) * 100 : 0;

  // Group errors by type
  const errorsByType: Record<string, number> = {};
  errors?.forEach((err) => {
    errorsByType[err.error_type] = (errorsByType[err.error_type] || 0) + 1;
  });

  // Group errors by endpoint
  const errorsByEndpoint: Record<string, number> = {};
  errors?.forEach((err) => {
    errorsByEndpoint[err.endpoint] = (errorsByEndpoint[err.endpoint] || 0) + 1;
  });

  return {
    totalErrors,
    errorRate,
    errorsByType,
    errorsByEndpoint,
    timeRange: { start: startDate, end: endDate },
  };
}

/**
 * Check if error rate exceeds threshold and alert if needed
 */
export async function checkErrorRateThreshold(
  threshold: number = 5.0 // Default 5% error rate threshold
): Promise<void> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const stats = await getErrorRateStats(oneHourAgo, now);

  if (stats.errorRate > threshold) {
    // Alert via Sentry
    captureMessage(
      `Error rate threshold exceeded: ${stats.errorRate.toFixed(2)}% (threshold: ${threshold}%)`,
      'warning',
      {
        extra: {
          errorRate: stats.errorRate,
          threshold,
          totalErrors: stats.totalErrors,
          errorsByType: stats.errorsByType,
          errorsByEndpoint: stats.errorsByEndpoint,
        },
      }
    );
  }
}

/**
 * Get top error endpoints
 */
export async function getTopErrorEndpoints(
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<Array<{ endpoint: string; count: number; errorRate: number }>> {
  const supabase = createClient();

  const { data: errors, error } = await supabase
    .from('error_logs')
    .select('endpoint')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString());

  if (error) {
    console.error('Failed to get top error endpoints:', error);
    return [];
  }

  // Count errors by endpoint
  const errorCounts: Record<string, number> = {};
  errors?.forEach((err) => {
    errorCounts[err.endpoint] = (errorCounts[err.endpoint] || 0) + 1;
  });

  // Sort by count and take top N
  const topEndpoints = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([endpoint, count]) => ({
      endpoint,
      count,
      errorRate: 0, // TODO: Calculate actual error rate per endpoint
    }));

  return topEndpoints;
}

/**
 * Get error trend over time
 */
export async function getErrorTrend(
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 60
): Promise<Array<{ timestamp: string; errorCount: number }>> {
  const supabase = createClient();

  const { data: errors, error } = await supabase
    .from('error_logs')
    .select('timestamp')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Failed to get error trend:', error);
    return [];
  }

  // Group errors by time interval
  const intervals: Record<string, number> = {};
  const intervalMs = intervalMinutes * 60 * 1000;

  errors?.forEach((err) => {
    const timestamp = new Date(err.timestamp);
    const intervalStart = new Date(
      Math.floor(timestamp.getTime() / intervalMs) * intervalMs
    );
    const intervalKey = intervalStart.toISOString();
    intervals[intervalKey] = (intervals[intervalKey] || 0) + 1;
  });

  // Convert to array and sort
  return Object.entries(intervals)
    .map(([timestamp, errorCount]) => ({
      timestamp,
      errorCount,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Clean up old error logs (retention policy)
 */
export async function cleanupOldErrorLogs(retentionDays: number = 90): Promise<number> {
  const supabase = createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('error_logs')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Failed to cleanup old error logs:', error);
    return 0;
  }

  return data?.length || 0;
}
