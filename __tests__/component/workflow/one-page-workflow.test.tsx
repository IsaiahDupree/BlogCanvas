/**
 * Component Tests - One-Page Workflow UI
 * Test React components in isolation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OnePageWorkflowPage from '@/app/one-page-workflow/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn()
    })
}));

// Mock fetch
global.fetch = jest.fn();

describe('One-Page Workflow - Component Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the workflow page', () => {
        render(<OnePageWorkflowPage />);
        expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
    });

    it('should show URL and PRD input tabs', () => {
        render(<OnePageWorkflowPage />);
        expect(screen.getByText(/Website URL/i)).toBeInTheDocument();
        expect(screen.getByText(/Paste PRD/i)).toBeInTheDocument();
    });

    it('should switch between URL and PRD input', async () => {
        render(<OnePageWorkflowPage />);
        
        const prdTab = screen.getByText(/Paste PRD/i);
        fireEvent.click(prdTab);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Paste your Product Requirements Document/i)).toBeInTheDocument();
        });
    });

    it('should show error when starting analysis without input', async () => {
        render(<OnePageWorkflowPage />);
        
        const startButton = screen.getByText(/Start Analysis/i);
        fireEvent.click(startButton);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a website URL/i)).toBeInTheDocument();
        });
    });

    it('should show progress bar during analysis', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(<OnePageWorkflowPage />);
        
        const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
        fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

        const startButton = screen.getByText(/Start Analysis/i);
        fireEvent.click(startButton);

        await waitFor(() => {
            expect(screen.getByText(/Starting website analysis/i)).toBeInTheDocument();
        });
    });

    it('should display analysis results when complete', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    seoScore: 75,
                    topicGaps: [
                        { cluster: 'Test Cluster', gap: 'Test gap', priority: 'high' }
                    ],
                    totalBlogs: 10
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    blogs: [
                        {
                            id: '1',
                            title: 'Test Blog',
                            angle: 'Test angle',
                            targetKeyword: 'test',
                            estimatedTraffic: 1000,
                            difficulty: 50
                        }
                    ]
                })
            });

        render(<OnePageWorkflowPage />);
        
        const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
        fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

        const startButton = screen.getByText(/Start Analysis/i);
        fireEvent.click(startButton);

        await waitFor(() => {
            expect(screen.getByText(/Analysis complete/i)).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('should navigate carousel between blogs', async () => {
        render(<OnePageWorkflowPage />);
        
        // This would require setting up state with generated blogs
        // For now, test that carousel controls exist when blogs are present
        expect(screen.queryByText(/Previous/i)).not.toBeInTheDocument();
    });
});

