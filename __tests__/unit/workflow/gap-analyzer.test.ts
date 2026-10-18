/**
 * Unit Tests - Gap Analyzer
 * Small, focused tests for individual functions
 */

import { describe, it, expect } from '@jest/globals';
import { prioritizeClusters } from '@/lib/analysis/topic-clusters';

describe('Gap Analyzer - Unit Tests', () => {
    describe('prioritizeClusters', () => {
        it('should filter out covered clusters', () => {
            const clusters = [
                { id: '1', name: 'Covered', primary_keyword: 'test', estimated_traffic: 1000, difficulty: 50, currently_covered: true, recommended_article_count: 5 },
                { id: '2', name: 'Not Covered', primary_keyword: 'test2', estimated_traffic: 1000, difficulty: 50, currently_covered: false, recommended_article_count: 5 }
            ];

            const result = prioritizeClusters(clusters);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('2');
        });

        it('should prioritize high traffic, low difficulty', () => {
            const clusters = [
                { id: '1', name: 'High Traffic Low Diff', primary_keyword: 'test1', estimated_traffic: 10000, difficulty: 20, currently_covered: false, recommended_article_count: 5 },
                { id: '2', name: 'Low Traffic High Diff', primary_keyword: 'test2', estimated_traffic: 1000, difficulty: 80, currently_covered: false, recommended_article_count: 5 }
            ];

            const result = prioritizeClusters(clusters);
            expect(result[0].id).toBe('1');
        });

        it('should return empty array for all covered clusters', () => {
            const clusters = [
                { id: '1', name: 'Covered', primary_keyword: 'test', estimated_traffic: 1000, difficulty: 50, currently_covered: true, recommended_article_count: 5 }
            ];

            const result = prioritizeClusters(clusters);
            expect(result.length).toBe(0);
        });
    });
});

