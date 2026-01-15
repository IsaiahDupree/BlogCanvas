import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
    parsePaginationParams,
    applyPagination,
    applySorting,
    createPaginatedResponse,
} from '@/lib/pagination';
import { queryCache, CacheKeys } from '@/lib/cache';

// GET /api/blog-posts - Get all blog posts with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const batchId = searchParams.get('batchId');
        const status = searchParams.get('status');
        const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);

        // Build cache key
        const cacheKey = CacheKeys.blogPosts({ batchId, status, page, limit, sortBy, sortOrder });

        // Try to get from cache
        const cached = queryCache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Build base query
        let query = supabaseAdmin
            .from('blog_posts')
            .select('id, topic, status, seo_quality_score, target_keyword, content_batch_id, created_at', { count: 'exact' });

        // Apply filters
        if (batchId) {
            query = query.eq('content_batch_id', batchId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        // Apply sorting
        const sortColumn = sortBy || 'created_at';
        query = applySorting(query, sortColumn, sortOrder);

        // Apply pagination
        query = applyPagination(query, page, limit);

        const { data: posts, count, error } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch posts' },
                { status: 500 }
            );
        }

        const response = {
            success: true,
            ...createPaginatedResponse(posts || [], count || 0, page, limit),
        };

        // Cache the response
        queryCache.set(cacheKey, response);

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in blog posts API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
