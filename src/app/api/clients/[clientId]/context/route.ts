import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSharedClientContext } from '@/lib/brand/shared-context';

/**
 * GET /api/clients/[clientId]/context
 * Returns the unified brand context for a client
 *
 * @feat-165 PRD Brand: GET /api/clients/{id}/context endpoint
 */

// Simple in-memory cache for context data
// Cache entries expire after 5 minutes
interface CacheEntry {
  data: any;
  timestamp: number;
}

const contextCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached context if still valid
 */
function getCachedContext(clientId: string) {
  const entry = contextCache.get(clientId);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    contextCache.delete(clientId);
    return null;
  }

  return entry.data;
}

/**
 * Store context in cache
 */
function setCachedContext(clientId: string, data: any) {
  contextCache.set(clientId, {
    data,
    timestamp: Date.now()
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to get vendor_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', user.id)
      .single();

    // Verify client access
    // Try to find client by UUID first, then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);

    let query = supabase
      .from('clients')
      .select('id, name, vendor_id');

    if (isUUID) {
      query = query.eq('id', clientId);
    } else {
      query = query.eq('slug', clientId);
    }

    // Filter by vendor if user has vendor_id
    if (profile?.vendor_id) {
      query = query.eq('vendor_id', profile.vendor_id);
    }

    const { data: client, error } = await query.single();

    if (error || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Use the actual client ID (not slug) for context fetching
    const actualClientId = client.id;

    // Check cache first
    const cachedContext = getCachedContext(actualClientId);
    if (cachedContext) {
      return NextResponse.json({
        success: true,
        context: cachedContext,
        cached: true
      });
    }

    // Fetch context from service
    const context = await getSharedClientContext(actualClientId);

    // Cache the result
    setCachedContext(actualClientId, context);

    return NextResponse.json({
      success: true,
      context,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching client context:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client context'
      },
      { status: 500 }
    );
  }
}
