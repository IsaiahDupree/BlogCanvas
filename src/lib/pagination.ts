/**
 * Pagination Utilities
 * feat-053: Performance optimization
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Default pagination limits
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Parse and validate pagination parameters from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): Required<Pick<PaginationParams, 'page' | 'limit'>> & Pick<PaginationParams, 'sortBy' | 'sortOrder'> {
  const page = Math.max(
    PAGINATION_DEFAULTS.MIN_LIMIT,
    parseInt(searchParams.get('page') || String(PAGINATION_DEFAULTS.DEFAULT_PAGE), 10)
  );

  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(
      PAGINATION_DEFAULTS.MIN_LIMIT,
      parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULTS.DEFAULT_LIMIT), 10)
    )
  );

  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination<T>(
  query: any,
  page: number,
  limit: number
): any {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return query.range(from, to);
}

/**
 * Apply sorting to a Supabase query
 */
export function applySorting(
  query: any,
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  return query.order(sortBy, { ascending: sortOrder === 'asc' });
}

/**
 * Get count from a Supabase query
 * Uses 'exact' count which is accurate but slower for large datasets
 * For better performance on large tables, consider using 'estimated' or 'planned'
 */
export async function getCount(query: any): Promise<number> {
  const { count, error } = await query
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Build a paginated query with count
 * Example usage:
 *
 * const { data, count } = await buildPaginatedQuery(
 *   supabase.from('blog_posts').select('*'),
 *   page,
 *   limit,
 *   'created_at',
 *   'desc'
 * );
 */
export async function buildPaginatedQuery<T>(
  baseQuery: any,
  page: number,
  limit: number,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ data: T[] | null; count: number; error: any }> {
  // Apply sorting
  let query = applySorting(baseQuery, sortBy, sortOrder);

  // Apply pagination
  query = applyPagination(query, page, limit);

  // Execute query with count
  const { data, count, error } = await query;

  return { data, count: count || 0, error };
}

/**
 * Create a complete paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    meta: calculatePaginationMeta(total, page, limit),
  };
}

/**
 * Build pagination links for API responses (optional)
 */
export function buildPaginationLinks(
  baseUrl: string,
  meta: PaginationMeta
): {
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
} {
  const url = new URL(baseUrl);
  const searchParams = new URLSearchParams(url.search);

  // First page
  searchParams.set('page', '1');
  searchParams.set('limit', String(meta.limit));
  const first = `${url.origin}${url.pathname}?${searchParams.toString()}`;

  // Previous page
  let prev: string | null = null;
  if (meta.hasPrevPage) {
    searchParams.set('page', String(meta.page - 1));
    prev = `${url.origin}${url.pathname}?${searchParams.toString()}`;
  }

  // Next page
  let next: string | null = null;
  if (meta.hasNextPage) {
    searchParams.set('page', String(meta.page + 1));
    next = `${url.origin}${url.pathname}?${searchParams.toString()}`;
  }

  // Last page
  searchParams.set('page', String(meta.totalPages));
  const last = `${url.origin}${url.pathname}?${searchParams.toString()}`;

  return { first, prev, next, last };
}

/**
 * Cursor-based pagination helpers (for real-time data)
 * More efficient than offset-based pagination for large datasets
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationMeta {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

/**
 * Apply cursor-based pagination to a Supabase query
 * Cursor should be the value of the sortBy field from the last item
 */
export function applyCursorPagination(
  query: any,
  cursor: string | undefined,
  limit: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  let paginatedQuery = query.limit(limit + 1); // Fetch one extra to check if there's more

  if (cursor) {
    const operator = sortOrder === 'asc' ? 'gt' : 'lt';
    paginatedQuery = paginatedQuery[operator](sortBy, cursor);
  }

  return paginatedQuery.order(sortBy, { ascending: sortOrder === 'asc' });
}

/**
 * Create a cursor-paginated response
 */
export function createCursorPaginatedResponse<T extends Record<string, any>>(
  data: T[],
  limit: number,
  sortBy: string
): CursorPaginatedResponse<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1][sortBy] : null;

  return {
    data: items,
    meta: {
      limit,
      hasMore,
      nextCursor,
    },
  };
}
