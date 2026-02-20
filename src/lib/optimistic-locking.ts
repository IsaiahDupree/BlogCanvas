/**
 * Optimistic Locking Utilities
 *
 * Prevents lost updates when multiple users edit the same record
 * Uses version numbers to detect concurrent modifications
 */

import { createClient } from '@supabase/supabase-js';

export interface OptimisticLockError extends Error {
  name: 'OptimisticLockError';
  message: string;
  currentVersion: number;
  attemptedVersion: number;
}

/**
 * Create an optimistic lock error
 */
export function createOptimisticLockError(
  currentVersion: number,
  attemptedVersion: number
): OptimisticLockError {
  const error = new Error(
    `Optimistic lock failed: Record was modified by another user. Current version: ${currentVersion}, Attempted version: ${attemptedVersion}`
  ) as OptimisticLockError;
  error.name = 'OptimisticLockError';
  error.currentVersion = currentVersion;
  error.attemptedVersion = attemptedVersion;
  return error;
}

/**
 * Update a record with optimistic locking
 *
 * @param supabase - Supabase client
 * @param table - Table name
 * @param id - Record ID
 * @param currentVersion - Current version number (from the record being edited)
 * @param updates - Fields to update
 * @returns Updated record or throws OptimisticLockError
 */
export async function updateWithOptimisticLock<T = any>(
  supabase: any,
  table: string,
  id: string,
  currentVersion: number,
  updates: Record<string, any>
): Promise<T> {
  // Fetch current record to check version
  const { data: currentRecord, error: fetchError } = await supabase
    .from(table)
    .select('version')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch record: ${fetchError.message}`);
  }

  if (!currentRecord) {
    throw new Error('Record not found');
  }

  // Check if version matches
  if (currentRecord.version !== currentVersion) {
    throw createOptimisticLockError(currentRecord.version, currentVersion);
  }

  // Update with incremented version
  const newVersion = currentVersion + 1;

  const { data: updatedRecord, error: updateError } = await supabase
    .from(table)
    .update({
      ...updates,
      version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', currentVersion) // Double-check version in WHERE clause
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update record: ${updateError.message}`);
  }

  if (!updatedRecord) {
    // Another update happened between our check and update
    const { data: latestRecord } = await supabase
      .from(table)
      .select('version')
      .eq('id', id)
      .single();

    throw createOptimisticLockError(
      latestRecord?.version || currentVersion + 1,
      currentVersion
    );
  }

  return updatedRecord as T;
}

/**
 * Initialize optimistic locking for a record
 * Adds version field if it doesn't exist
 */
export async function initializeOptimisticLock(
  supabase: any,
  table: string,
  id: string
): Promise<void> {
  const { data: record } = await supabase
    .from(table)
    .select('version')
    .eq('id', id)
    .single();

  if (!record || record.version === undefined || record.version === null) {
    await supabase
      .from(table)
      .update({ version: 1 })
      .eq('id', id);
  }
}

/**
 * Retry an update operation with optimistic locking
 *
 * @param operation - Function that performs the update
 * @param maxRetries - Maximum number of retry attempts
 * @param retryDelay - Delay between retries in milliseconds
 */
export async function retryWithOptimisticLock<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.name === 'OptimisticLockError') {
        lastError = error;

        if (attempt < maxRetries - 1) {
          // Wait before retrying with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
          continue;
        }
      } else {
        // Not an optimistic lock error, throw immediately
        throw error;
      }
    }
  }

  throw lastError || new Error('Failed after maximum retries');
}

/**
 * Middleware to add version tracking to tables
 * Run this migration to add version columns to existing tables
 */
export function generateOptimisticLockMigration(tables: string[]): string {
  const migrations = tables.map(
    (table) => `
-- Add version column to ${table}
ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add index for performance
CREATE INDEX IF NOT EXISTS ${table}_version_idx ON ${table}(version);

-- Add trigger to increment version on update
CREATE OR REPLACE FUNCTION increment_version_${table}()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_version_trigger ON ${table};
CREATE TRIGGER increment_version_trigger
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE FUNCTION increment_version_${table}();
`
  );

  return migrations.join('\n\n');
}

/**
 * Check if a record has been modified since it was loaded
 */
export async function hasRecordBeenModified(
  supabase: any,
  table: string,
  id: string,
  loadedVersion: number
): Promise<boolean> {
  const { data: currentRecord } = await supabase
    .from(table)
    .select('version')
    .eq('id', id)
    .single();

  return currentRecord?.version !== loadedVersion;
}

/**
 * Get current version of a record
 */
export async function getCurrentVersion(
  supabase: any,
  table: string,
  id: string
): Promise<number | null> {
  const { data: record } = await supabase
    .from(table)
    .select('version')
    .eq('id', id)
    .single();

  return record?.version ?? null;
}

/**
 * Example usage in an API route:
 *
 * ```typescript
 * import { updateWithOptimisticLock } from '@/lib/optimistic-locking';
 *
 * export async function PATCH(request: NextRequest) {
 *   const { id, version, ...updates } = await request.json();
 *
 *   try {
 *     const updated = await updateWithOptimisticLock(
 *       supabase,
 *       'blog_posts',
 *       id,
 *       version,
 *       updates
 *     );
 *
 *     return NextResponse.json({ success: true, data: updated });
 *   } catch (error: any) {
 *     if (error.name === 'OptimisticLockError') {
 *       return NextResponse.json(
 *         {
 *           error: 'Record was modified by another user. Please refresh and try again.',
 *           currentVersion: error.currentVersion,
 *         },
 *         { status: 409 } // Conflict
 *       );
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
