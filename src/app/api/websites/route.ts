import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
    parsePaginationParams,
    applyPagination,
    applySorting,
    createPaginatedResponse,
} from '@/lib/pagination';
import { queryCache, CacheKeys } from '@/lib/cache';

// GET /api/websites - List all websites with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);
        const clientId = searchParams.get('clientId');

        // Build cache key
        const cacheKey = CacheKeys.websites({ page, limit, sortBy, sortOrder, clientId });

        // Try to get from cache
        const cached = queryCache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build query with count
        let query = supabaseAdmin
            .from('websites')
            .select('*', { count: 'exact' });

        // Filter by client if provided
        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        // Apply sorting
        const sortColumn = sortBy || 'created_at';
        query = applySorting(query, sortColumn, sortOrder);

        // Apply pagination
        query = applyPagination(query, page, limit);

        const { data: websites, count, error } = await query;

        if (error) throw error;

        const response = {
            success: true,
            ...createPaginatedResponse(websites || [], count || 0, page, limit),
        };

        // Cache the response
        queryCache.set(cacheKey, response);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching websites:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch websites' },
            { status: 500 }
        );
    }
}

// POST /api/websites - Create new website
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, clientId, targetMarket, platform, isPrimary } = body;

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate and parse URL
        let websiteUrl: URL;
        try {
            websiteUrl = new URL(url);
        } catch (e) {
            return NextResponse.json(
                { success: false, error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Auto-detect platform if not provided
        let detectedPlatform = platform || 'unknown';
        if (!platform || platform === 'unknown') {
            // Call the database function to detect platform
            const { data: platformData } = await supabaseAdmin
                .rpc('detect_website_platform', {
                    website_url: websiteUrl.href,
                    html_content: null
                });

            if (platformData) {
                detectedPlatform = platformData;
            }
        }

        // If isPrimary is true, unset any existing primary website for this client
        if (isPrimary && clientId) {
            await supabaseAdmin
                .from('websites')
                .update({ is_primary: false })
                .eq('client_id', clientId)
                .eq('is_primary', true);
        }

        // Create website record
        const { data: website, error } = await supabaseAdmin
            .from('websites')
            .insert({
                url: websiteUrl.origin,
                domain: websiteUrl.hostname,
                scrape_status: 'pending',
                client_id: clientId || null,
                target_market: targetMarket || null,
                platform: detectedPlatform,
                is_primary: isPrimary || false
            })
            .select()
            .single();

        if (error) {
            console.error('Database error creating website:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'Failed to create website' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            website
        });
    } catch (error) {
        console.error('Error creating website:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
