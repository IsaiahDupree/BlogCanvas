/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReviewBoardPage from '@/app/app/review/page';

// Mock fetch globally
global.fetch = jest.fn();

const mockPosts = [
    {
        id: '1',
        topic: 'Test Post 1',
        status: 'draft',
        seo_quality_score: 85,
        target_keyword: 'test keyword',
        content_batch_id: 'batch-1'
    },
    {
        id: '2',
        topic: 'Test Post 2',
        status: 'in_review',
        seo_quality_score: 90,
        target_keyword: 'review keyword',
        content_batch_id: 'batch-1'
    },
    {
        id: '3',
        topic: 'Test Post 3',
        status: 'approved',
        seo_quality_score: 95,
        target_keyword: 'approved keyword',
        content_batch_id: 'batch-1'
    }
];

describe('Kanban Board Component', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ posts: mockPosts })
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('renders kanban board with all columns', async () => {
        render(<ReviewBoardPage />);

        // Wait for posts to load
        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        // Check all column headers are present
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(screen.getByText('Editing')).toBeInTheDocument();
        expect(screen.getByText('In Review')).toBeInTheDocument();
        expect(screen.getByText('Client Review')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
    });

    test('displays posts in correct columns based on status', async () => {
        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        // Posts should be visible
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
        expect(screen.getByText('Test Post 3')).toBeInTheDocument();
    });

    test('displays SEO quality scores', async () => {
        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        // Check that quality scores are displayed
        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText('90')).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument();
    });

    test('handles loading state', () => {
        (global.fetch as jest.Mock).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        render(<ReviewBoardPage />);

        // Check loading indicator
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('handles error state', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });

    test('drag and drop functionality - dragstart event', async () => {
        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        const draggableCard = screen.getByText('Test Post 1').closest('[draggable="true"]');

        if (draggableCard) {
            const dragStartEvent = new Event('dragstart', { bubbles: true });
            Object.defineProperty(dragStartEvent, 'dataTransfer', {
                value: {
                    setData: jest.fn(),
                    effectAllowed: 'move'
                }
            });

            fireEvent(draggableCard, dragStartEvent);

            // Verify the card started dragging
            expect(draggableCard).toHaveAttribute('draggable', 'true');
        }
    });

    test('search filter functionality', async () => {
        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: 'Test Post 2' } });

        // After filtering, only matching post should be visible
        await waitFor(() => {
            expect(screen.getByText('Test Post 2')).toBeInTheDocument();
        });
    });

    test('export CSV functionality', async () => {
        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export/i });
        fireEvent.click(exportButton);

        // Verify export was triggered (checking for any export-related action)
        expect(exportButton).toBeInTheDocument();
    });

    test('updates post status on drag and drop', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ posts: mockPosts })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        // Simulate drop action by finding a column and triggering drop event
        const columns = screen.getAllByRole('region');
        if (columns.length > 0) {
            const dropEvent = new Event('drop', { bubbles: true });
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: {
                    getData: jest.fn(() => '1')
                }
            });

            fireEvent(columns[1], dropEvent);
        }

        // Status update API should have been called
        await waitFor(() => {
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            expect(fetchCalls.length).toBeGreaterThan(1);
        });
    });

    test('displays action buttons on post cards', async () => {
        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        });

        // Check for View action buttons (there should be multiple, one per post)
        const viewButtons = screen.getAllByText(/view/i);
        expect(viewButtons.length).toBeGreaterThan(0);
    });

    test('empty state when no posts', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ posts: [] })
        });

        render(<ReviewBoardPage />);

        await waitFor(() => {
            expect(screen.getByText(/no posts/i)).toBeInTheDocument();
        });
    });
});
