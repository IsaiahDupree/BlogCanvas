import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WordPressClient } from '@/lib/wordpress/client';

// Simple decryption for stored passwords (matching connections/route.ts)
function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

/**
 * GET /api/wordpress/taxonomies
 * Fetch categories and tags from a WordPress site
 *
 * Query params:
 * - connectionId: UUID of wordpress_connections record
 * - clientId: UUID of client (alternative to connectionId)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');
    const clientId = searchParams.get('clientId');

    if (!connectionId && !clientId) {
      return NextResponse.json({
        error: 'Missing required parameter: connectionId or clientId'
      }, { status: 400 });
    }

    // Get WordPress connection
    let query = supabase
      .from('wordpress_connections')
      .select('*');

    if (connectionId) {
      query = query.eq('id', connectionId);
    } else if (clientId) {
      query = query.eq('client_id', clientId).eq('is_active', true);
    }

    const { data: connection, error: connError } = await query.single();

    if (connError || !connection) {
      return NextResponse.json({
        error: 'WordPress connection not found'
      }, { status: 404 });
    }

    // Create WordPress client
    const wpClient = new WordPressClient({
      siteUrl: connection.site_url,
      username: connection.username,
      applicationPassword: decryptPassword(connection.application_password_encrypted)
    });

    // Fetch categories and tags in parallel
    const [categories, tags] = await Promise.all([
      wpClient.getCategories(),
      wpClient.getTags()
    ]);

    return NextResponse.json({
      success: true,
      connectionId: connection.id,
      siteUrl: connection.site_url,
      siteName: connection.site_name,
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug
      })),
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug
      }))
    });

  } catch (error: any) {
    console.error('Fetch WordPress taxonomies error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch categories and tags'
    }, { status: 500 });
  }
}
