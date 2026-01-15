import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
    parsePaginationParams,
    applyPagination,
    applySorting,
    createPaginatedResponse,
} from '@/lib/pagination';
import { queryCache, CacheKeys, CacheInvalidation } from '@/lib/cache';

// GET /api/content-batches - List all content batches with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);

        // Build cache key
        const cacheKey = CacheKeys.contentBatches({ page, limit, sortBy, sortOrder });

        // Try to get from cache
        const cached = queryCache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build query with count
        let query = supabaseAdmin
            .from('content_batches')
            .select(`
                *,
                website:websites(url, domain)
            `, { count: 'exact' });

        // Apply sorting
        const sortColumn = sortBy || 'created_at';
        query = applySorting(query, sortColumn, sortOrder);

        // Apply pagination
        query = applyPagination(query, page, limit);

        const { data: batches, count, error } = await query;

        if (error) throw error;

        const response = {
            success: true,
            ...createPaginatedResponse(batches || [], count || 0, page, limit),
        };

        // Cache the response
        queryCache.set(cacheKey, response);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching batches:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch batches' },
            { status: 500 }
        );
    }
}

// POST /api/content-batches - Create new content batch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            websiteId,
            clientId,
            name,
            goalScoreFrom,
            goalScoreTo,
            startDate,
            endDate,
            totalPosts
        } = body;

        if (!websiteId || !name) {
            return NextResponse.json(
                { success: false, error: 'Website ID and name are required' },
                { status: 400 }
            );
        }

        // Create batch
        const { data: batch, error } = await supabaseAdmin
            .from('content_batches')
            .insert({
                website_id: websiteId,
                client_id: clientId,
                name,
                goal_score_from: goalScoreFrom,
                goal_score_to: goalScoreTo,
                start_date: startDate,
                end_date: endDate,
                total_posts: totalPosts,
                status: 'planned',
                posts_approved: 0,
                posts_completed: 0,
                posts_published: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating batch:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create batch' },
                { status: 500 }
            );
        }

        // Invalidate content batch cache
        CacheInvalidation.contentBatch();

        return NextResponse.json({
            success: true,
            batch
        });

    } catch (error) {
        console.error('Error in batch creation:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
