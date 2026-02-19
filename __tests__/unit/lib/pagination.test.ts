/**
 * Unit tests for Pagination Utilities
 * Tests parameter parsing, metadata calculation, and validation
 */

import {
    parsePaginationParams,
    calculatePaginationMeta,
    PAGINATION_DEFAULTS,
} from '@/lib/pagination';

describe('Pagination Utilities', () => {
    describe('parsePaginationParams', () => {
        it('should use default values when no params provided', () => {
            const searchParams = new URLSearchParams();
            const result = parsePaginationParams(searchParams);

            expect(result.page).toBe(PAGINATION_DEFAULTS.DEFAULT_PAGE);
            expect(result.limit).toBe(PAGINATION_DEFAULTS.DEFAULT_LIMIT);
            expect(result.sortOrder).toBe('desc');
        });

        it('should parse valid page and limit params', () => {
            const searchParams = new URLSearchParams({
                page: '3',
                limit: '50',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.page).toBe(3);
            expect(result.limit).toBe(50);
        });

        it('should enforce maximum limit', () => {
            const searchParams = new URLSearchParams({
                limit: '500', // Exceeds MAX_LIMIT of 100
            });
            const result = parsePaginationParams(searchParams);

            expect(result.limit).toBe(PAGINATION_DEFAULTS.MAX_LIMIT);
        });

        it('should enforce minimum limit', () => {
            const searchParams = new URLSearchParams({
                limit: '0',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.limit).toBe(PAGINATION_DEFAULTS.MIN_LIMIT);
        });

        it('should enforce minimum page', () => {
            const searchParams = new URLSearchParams({
                page: '0',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.page).toBe(PAGINATION_DEFAULTS.MIN_LIMIT);
        });

        it('should handle negative values', () => {
            const searchParams = new URLSearchParams({
                page: '-5',
                limit: '-10',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.page).toBe(PAGINATION_DEFAULTS.MIN_LIMIT);
            expect(result.limit).toBe(PAGINATION_DEFAULTS.MIN_LIMIT);
        });

        it('should handle invalid number strings', () => {
            const searchParams = new URLSearchParams({
                page: 'invalid',
                limit: 'not-a-number',
            });
            const result = parsePaginationParams(searchParams);

            // Should fall back to defaults when parseInt returns NaN
            expect(result.page).toBeGreaterThan(0);
            expect(result.limit).toBeGreaterThan(0);
        });

        it('should parse sortBy parameter', () => {
            const searchParams = new URLSearchParams({
                sortBy: 'created_at',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.sortBy).toBe('created_at');
        });

        it('should parse sortOrder parameter', () => {
            const searchParams = new URLSearchParams({
                sortOrder: 'asc',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.sortOrder).toBe('asc');
        });

        it('should default sortOrder to desc', () => {
            const searchParams = new URLSearchParams();
            const result = parsePaginationParams(searchParams);

            expect(result.sortOrder).toBe('desc');
        });

        it('should handle empty sortBy', () => {
            const searchParams = new URLSearchParams({
                sortBy: '',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.sortBy).toBeUndefined();
        });
    });

    describe('calculatePaginationMeta', () => {
        it('should calculate correct metadata for first page', () => {
            const meta = calculatePaginationMeta(100, 1, 20);

            expect(meta.page).toBe(1);
            expect(meta.limit).toBe(20);
            expect(meta.total).toBe(100);
            expect(meta.totalPages).toBe(5);
            expect(meta.hasNextPage).toBe(true);
            expect(meta.hasPrevPage).toBe(false);
        });

        it('should calculate correct metadata for middle page', () => {
            const meta = calculatePaginationMeta(100, 3, 20);

            expect(meta.page).toBe(3);
            expect(meta.totalPages).toBe(5);
            expect(meta.hasNextPage).toBe(true);
            expect(meta.hasPrevPage).toBe(true);
        });

        it('should calculate correct metadata for last page', () => {
            const meta = calculatePaginationMeta(100, 5, 20);

            expect(meta.page).toBe(5);
            expect(meta.totalPages).toBe(5);
            expect(meta.hasNextPage).toBe(false);
            expect(meta.hasPrevPage).toBe(true);
        });

        it('should handle partial last page', () => {
            const meta = calculatePaginationMeta(95, 5, 20);

            expect(meta.totalPages).toBe(5);
            expect(meta.hasNextPage).toBe(false);
        });

        it('should handle zero total', () => {
            const meta = calculatePaginationMeta(0, 1, 20);

            expect(meta.total).toBe(0);
            expect(meta.totalPages).toBe(0);
            expect(meta.hasNextPage).toBe(false);
            expect(meta.hasPrevPage).toBe(false);
        });

        it('should handle single page of results', () => {
            const meta = calculatePaginationMeta(15, 1, 20);

            expect(meta.totalPages).toBe(1);
            expect(meta.hasNextPage).toBe(false);
            expect(meta.hasPrevPage).toBe(false);
        });

        it('should handle exactly one full page', () => {
            const meta = calculatePaginationMeta(20, 1, 20);

            expect(meta.totalPages).toBe(1);
            expect(meta.hasNextPage).toBe(false);
        });

        it('should handle large datasets', () => {
            const meta = calculatePaginationMeta(10000, 50, 100);

            expect(meta.totalPages).toBe(100);
            expect(meta.hasNextPage).toBe(true);
            expect(meta.hasPrevPage).toBe(true);
        });

        it('should calculate correctly when total equals limit', () => {
            const meta = calculatePaginationMeta(20, 1, 20);

            expect(meta.totalPages).toBe(1);
            expect(meta.hasNextPage).toBe(false);
        });

        it('should calculate correctly when total is one more than limit', () => {
            const meta = calculatePaginationMeta(21, 1, 20);

            expect(meta.totalPages).toBe(2);
            expect(meta.hasNextPage).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large page numbers', () => {
            const searchParams = new URLSearchParams({
                page: '999999',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.page).toBe(999999);
        });

        it('should handle decimal page numbers by truncating', () => {
            const searchParams = new URLSearchParams({
                page: '3.7',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.page).toBe(3);
        });

        it('should handle decimal limit by truncating', () => {
            const searchParams = new URLSearchParams({
                limit: '25.9',
            });
            const result = parsePaginationParams(searchParams);

            expect(result.limit).toBe(25);
        });

        it('should handle page beyond total pages', () => {
            const meta = calculatePaginationMeta(100, 10, 20);

            expect(meta.page).toBe(10);
            expect(meta.totalPages).toBe(5);
            expect(meta.hasNextPage).toBe(false);
        });
    });

    describe('Integration: Full pagination flow', () => {
        it('should handle complete pagination scenario', () => {
            // Simulate paginating through a dataset
            const totalItems = 47;
            const limit = 10;
            const pages = [];

            for (let page = 1; page <= Math.ceil(totalItems / limit); page++) {
                const meta = calculatePaginationMeta(totalItems, page, limit);
                pages.push(meta);
            }

            expect(pages).toHaveLength(5);

            // First page
            expect(pages[0].hasPrevPage).toBe(false);
            expect(pages[0].hasNextPage).toBe(true);

            // Middle pages
            expect(pages[2].hasPrevPage).toBe(true);
            expect(pages[2].hasNextPage).toBe(true);

            // Last page
            expect(pages[4].hasPrevPage).toBe(true);
            expect(pages[4].hasNextPage).toBe(false);
        });

        it('should work with URL query string parsing', () => {
            const url = new URL('https://example.com/posts?page=3&limit=25&sortBy=created_at&sortOrder=asc');
            const params = parsePaginationParams(url.searchParams);

            expect(params.page).toBe(3);
            expect(params.limit).toBe(25);
            expect(params.sortBy).toBe('created_at');
            expect(params.sortOrder).toBe('asc');

            const meta = calculatePaginationMeta(100, params.page, params.limit);
            expect(meta.totalPages).toBe(4);
        });
    });

    describe('PAGINATION_DEFAULTS constants', () => {
        it('should have sensible default values', () => {
            expect(PAGINATION_DEFAULTS.DEFAULT_PAGE).toBe(1);
            expect(PAGINATION_DEFAULTS.DEFAULT_LIMIT).toBe(20);
            expect(PAGINATION_DEFAULTS.MAX_LIMIT).toBe(100);
            expect(PAGINATION_DEFAULTS.MIN_LIMIT).toBe(1);
        });

        it('should have MAX_LIMIT greater than DEFAULT_LIMIT', () => {
            expect(PAGINATION_DEFAULTS.MAX_LIMIT).toBeGreaterThan(
                PAGINATION_DEFAULTS.DEFAULT_LIMIT
            );
        });

        it('should have DEFAULT_LIMIT greater than MIN_LIMIT', () => {
            expect(PAGINATION_DEFAULTS.DEFAULT_LIMIT).toBeGreaterThan(
                PAGINATION_DEFAULTS.MIN_LIMIT
            );
        });
    });
});
