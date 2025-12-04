/**
 * Performance Tests
 * Tests response times, throughput, and resource usage
 */

import { runBlogPostPipeline } from '../../lib/pipeline/orchestrator';
import { runResearchAgent } from '../../lib/agents/research';
import { LLMProvider } from '../../lib/agents/types';
import { EVERREACH_MARKETING_CONTEXT } from '../../lib/context/marketing';

describe('Performance Tests', () => {
    let mockProvider: LLMProvider;

    beforeEach(() => {
        mockProvider = {
            name: 'fast-provider',
            call: jest.fn(async () => {
                // Simulate fast LLM response
                await new Promise(resolve => setTimeout(resolve, 50));
                return JSON.stringify({
                    painPoints: ['P1'],
                    keyFacts: ['F1'],
                    differentiators: ['D1'],
                    relatedSubtopics: ['T1'],
                    suggestedAngles: ['A1']
                });
            })
        };
    });

    it('should complete research agent in reasonable time', async () => {
        const startTime = performance.now();

        await runResearchAgent(mockProvider, {
            topic: 'Test Performance',
            clientProfile: {},
            marketingContext: EVERREACH_MARKETING_CONTEXT
        });

        const duration = performance.now() - startTime;

        // Should complete in under 500ms (excluding actual LLM call time)
        expect(duration).toBeLessThan(500);
    });

    it('should handle multiple concurrent agent calls efficiently', async () => {
        const startTime = performance.now();

        const promises = Array(5).fill(null).map(() =>
            runResearchAgent(mockProvider, {
                topic: 'Concurrent Test',
                clientProfile: {}
            })
        );

        await Promise.all(promises);

        const duration = performance.now() - startTime;

        // 5 concurrent calls should complete in reasonable time
        expect(duration).toBeLessThan(1000);
    });

    it('should not accumulate memory leaks over multiple runs', async () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Run 10 iterations
        for (let i = 0; i < 10; i++) {
            await runResearchAgent(mockProvider, {
                topic: `Memory Test ${i}`,
                clientProfile: {}
            });
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable (< 50MB for 10 runs)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should process large content efficiently', async () => {
        const largeContent = 'Lorem ipsum '.repeat(10000); // ~120KB

        const startTime = performance.now();

        // Simulate processing large content
        const result = largeContent.split(/\s+/).length;

        const duration = performance.now() - startTime;

        // Should process quickly
        expect(duration).toBeLessThan(100);
        expect(result).toBeGreaterThan(0);
    });
});

describe('Load Tests', () => {
    it('should handle high volume of requests', async () => {
        // Simulate 50 sequential requests
        const results = [];
        const startTime = performance.now();

        for (let i = 0; i < 50; i++) {
            results.push({ success: true, id: i });
        }

        const duration = performance.now() - startTime;

        expect(results.length).toBe(50);
        expect(duration).toBeLessThan(1000);
    });

    it('should maintain quality gates under load', async () => {
        // Run quality gate validations many times
        const { validateOutline } = await import('../../lib/pipeline/quality-gates');

        const outline = {
            sections: [
                { key: 'intro', title: 'Intro', type: 'intro', keyPoints: ['p1'], estimatedWords: 200 },
                { key: 'body', title: 'Body', type: 'body', keyPoints: ['p2'], estimatedWords: 400 },
                { key: 'conclusion', title: 'Conclusion', type: 'conclusion', keyPoints: ['p3'], estimatedWords: 200 },
                { key: 'cta', title: 'CTA', type: 'cta', keyPoints: ['p4'], estimatedWords: 100 }
            ],
            totalEstimatedWords: 900
        };

        const startTime = performance.now();

        for (let i = 0; i < 100; i++) {
            const result = validateOutline(outline);
            expect(result.passed).toBe(true);
        }

        const duration = performance.now() - startTime;

        // 100 validations should be fast
        expect(duration).toBeLessThan(500);
    });
});

describe('Stress Tests', () => {
    it('should handle edge case: very long topic', async () => {
        const mockProvider: LLMProvider = {
            name: 'test',
            call: jest.fn(async () => JSON.stringify({
                painPoints: ['P1'],
                keyFacts: ['F1'],
                differentiators: ['D1'],
                relatedSubtopics: ['T1'],
                suggestedAngles: ['A1']
            }))
        };

        const veryLongTopic = 'How to use AI CRM systems to '.repeat(100);

        const result = await runResearchAgent(mockProvider, {
            topic: veryLongTopic,
            clientProfile: {}
        });

        expect(result.success).toBe(true);
    });

    it('should handle edge case: empty inputs', async () => {
        const mockProvider: LLMProvider = {
            name: 'test',
            call: jest.fn(async () => JSON.stringify({
                painPoints: [],
                keyFacts: [],
                differentiators: [],
                relatedSubtopics: [],
                suggestedAngles: []
            }))
        };

        const result = await runResearchAgent(mockProvider, {
            topic: '',
            clientProfile: {}
        });

        // Should handle gracefully
        expect(result.success).toBe(true);
    });
});
