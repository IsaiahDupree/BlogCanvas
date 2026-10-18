/**
 * One-Page Workflow Integration Tests
 * Tests the complete end-to-end workflow from input to export
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

import { getTestUrl } from '../setup/server-manager';
const BASE_URL = getTestUrl();
const SKIP_API_TESTS = process.env.SKIP_API_TESTS === 'true';

describe('One-Page Workflow - Full E2E Tests', () => {
    beforeAll(() => {
        if (SKIP_API_TESTS) {
            console.log('⚠️ Skipping API tests (SKIP_API_TESTS=true)');
        }
    });

    describe('Gap Analysis API', () => {
        it('should analyze website URL and return SEO gaps', async () => {
            if (SKIP_API_TESTS) {
                return;
            }

            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'https://example.com',
                    inputType: 'url'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.seoScore).toBeGreaterThanOrEqual(0);
            expect(data.seoScore).toBeLessThanOrEqual(100);
            expect(Array.isArray(data.topicGaps)).toBe(true);
            expect(typeof data.totalBlogs).toBe('number');
        }, 60000); // 60 second timeout for scraping

        it('should analyze PRD text and return SEO gaps', async () => {
            if (SKIP_API_TESTS) {
                return;
            }

            const prdText = `
                Product: E-commerce Platform
                Target Audience: Small business owners
                Goals: Increase organic traffic by 50%
                Content Needs: Blog posts about e-commerce best practices
            `;

            const response = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: prdText,
                    inputType: 'prd'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.seoScore).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(data.topicGaps)).toBe(true);
        }, 30000);
    });

    describe('Blog Suggestions API', () => {
        it('should generate blog suggestions from analysis', async () => {
            if (SKIP_API_TESTS) {
                return;
            }

            const mockAnalysis = {
                seoScore: 65,
                topicGaps: [
                    {
                        cluster: 'Getting Started',
                        gap: 'Missing beginner guides',
                        priority: 'high'
                    }
                ],
                clusters: [
                    {
                        id: '1',
                        name: 'Getting Started Guides',
                        primary_keyword: 'how to get started',
                        estimated_traffic: 5000,
                        difficulty: 40,
                        recommended_article_count: 5
                    }
                ]
            };

            const response = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis: mockAnalysis })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(Array.isArray(data.blogs)).toBe(true);
            expect(data.blogs.length).toBeGreaterThan(0);

            const blog = data.blogs[0];
            expect(blog).toHaveProperty('id');
            expect(blog).toHaveProperty('title');
            expect(blog).toHaveProperty('angle');
            expect(blog).toHaveProperty('targetKeyword');
            expect(blog).toHaveProperty('estimatedTraffic');
            expect(blog).toHaveProperty('difficulty');
        }, 30000);
    });

    describe('Blog Generation API', () => {
        it('should generate full blog content with OpenAI', async () => {
            if (SKIP_API_TESTS || !process.env.OPENAI_API_KEY) {
                console.log('⚠️ Skipping OpenAI test (no API key)');
                return;
            }

            const mockBlogs = [
                {
                    id: 'test-1',
                    title: 'How to Get Started with SEO',
                    angle: 'Educational approach for beginners',
                    targetKeyword: 'seo for beginners',
                    estimatedTraffic: 5000,
                    difficulty: 40
                }
            ];

            const response = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogs: mockBlogs,
                    includeImages: true,
                    humanTone: true
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(Array.isArray(data.blogs)).toBe(true);
            expect(data.blogs.length).toBe(1);

            const blog = data.blogs[0];
            expect(blog).toHaveProperty('content');
            expect(blog.content).toBeTruthy();
            expect(blog.content.length).toBeGreaterThan(100);
            expect(blog).toHaveProperty('seoScore');
            expect(blog.seoScore).toBeGreaterThanOrEqual(0);
            expect(blog.seoScore).toBeLessThanOrEqual(100);
            expect(blog).toHaveProperty('wordCount');
            expect(blog.wordCount).toBeGreaterThan(0);
        }, 120000); // 2 minute timeout for OpenAI generation

        it('should generate images with DALL-E when includeImages is true', async () => {
            if (SKIP_API_TESTS || !process.env.OPENAI_API_KEY) {
                console.log('⚠️ Skipping OpenAI image test (no API key)');
                return;
            }

            const mockBlogs = [
                {
                    id: 'test-2',
                    title: 'Complete Guide to Digital Marketing',
                    angle: 'Comprehensive tutorial',
                    targetKeyword: 'digital marketing guide',
                    estimatedTraffic: 3000,
                    difficulty: 50
                }
            ];

            const response = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogs: mockBlogs,
                    includeImages: true,
                    humanTone: true
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.success).toBe(true);

            const blog = data.blogs[0];
            if (blog.imageUrl) {
                expect(blog.imageUrl).toMatch(/^https?:\/\//);
                // Verify image URL is accessible
                const imageResponse = await fetch(blog.imageUrl, { method: 'HEAD' });
                expect(imageResponse.ok).toBe(true);
            }
        }, 120000);
    });

    describe('Export APIs', () => {
        const mockBlogs = [
            {
                id: 'export-1',
                title: 'Test Blog Post',
                angle: 'Test angle',
                targetKeyword: 'test keyword',
                content: '<h1>Test Content</h1><p>This is test content for export.</p>',
                seoScore: 85,
                wordCount: 500,
                imageUrl: 'https://example.com/image.jpg'
            }
        ];

        it('should export blogs as Markdown', async () => {
            if (SKIP_API_TESTS) {
                return;
            }

            const response = await fetch(`${BASE_URL}/api/workflow/export?format=markdown`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs: mockBlogs })
            });

            expect(response.ok).toBe(true);
            const content = await response.text();
            expect(content).toContain('# Blog Export');
            expect(content).toContain('Test Blog Post');
            expect(content).toContain('test keyword');
        }, 30000);

        it('should export blogs as HTML/PDF', async () => {
            if (SKIP_API_TESTS) {
                return;
            }

            const response = await fetch(`${BASE_URL}/api/workflow/export?format=pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs: mockBlogs })
            });

            expect(response.ok).toBe(true);
            const content = await response.text();
            expect(content).toContain('<!DOCTYPE html>');
            expect(content).toContain('Test Blog Post');
        }, 30000);

        it('should handle Google Docs export request', async () => {
            if (SKIP_API_TESTS) {
                return;
            }

            const response = await fetch(`${BASE_URL}/api/workflow/export-google-docs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs: mockBlogs })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data).toHaveProperty('folderName');
            expect(data).toHaveProperty('blogsExported');
        }, 30000);
    });

    describe('Complete Workflow E2E', () => {
        it('should complete full workflow: URL → Analysis → Suggestions → Generation → Export', async () => {
            if (SKIP_API_TESTS || !process.env.OPENAI_API_KEY) {
                console.log('⚠️ Skipping full E2E test (no API key or SKIP_API_TESTS=true)');
                return;
            }

            // Step 1: Gap Analysis
            const analysisResponse = await fetch(`${BASE_URL}/api/workflow/gap-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: 'https://example.com',
                    inputType: 'url'
                })
            });

            expect(analysisResponse.ok).toBe(true);
            const analysis = await analysisResponse.json();
            expect(analysis.success).toBe(true);

            // Step 2: Generate Suggestions
            const suggestionsResponse = await fetch(`${BASE_URL}/api/workflow/generate-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis })
            });

            expect(suggestionsResponse.ok).toBe(true);
            const suggestions = await suggestionsResponse.json();
            expect(suggestions.success).toBe(true);
            expect(suggestions.blogs.length).toBeGreaterThan(0);

            // Step 3: Generate Content (limit to 2 blogs for testing)
            const blogsToGenerate = suggestions.blogs.slice(0, 2);
            const generateResponse = await fetch(`${BASE_URL}/api/workflow/generate-blogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blogs: blogsToGenerate,
                    includeImages: true,
                    humanTone: true
                })
            });

            expect(generateResponse.ok).toBe(true);
            const generated = await generateResponse.json();
            expect(generated.success).toBe(true);
            expect(generated.blogs.length).toBe(blogsToGenerate.length);

            // Verify all blogs have content
            for (const blog of generated.blogs) {
                expect(blog.content).toBeTruthy();
                expect(blog.content.length).toBeGreaterThan(100);
                expect(blog.seoScore).toBeGreaterThanOrEqual(0);
                expect(blog.wordCount).toBeGreaterThan(0);
            }

            // Step 4: Export
            const exportResponse = await fetch(`${BASE_URL}/api/workflow/export?format=markdown`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs: generated.blogs })
            });

            expect(exportResponse.ok).toBe(true);
            const exportContent = await exportResponse.text();
            expect(exportContent).toContain('# Blog Export');
            expect(exportContent).toContain(generated.blogs[0].title);
        }, 300000); // 5 minute timeout for full workflow
    });
});

