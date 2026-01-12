/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThreadedComments from '@/components/ThreadedComments';

// Mock fetch globally
global.fetch = jest.fn();

const mockComments = [
    {
        id: '1',
        blog_post_id: 'post-1',
        parent_comment_id: null,
        author_id: 'user-1',
        author_name: 'John Doe',
        author_role: 'editor',
        content: 'This is a top-level comment',
        mentioned_user_ids: [],
        is_resolved: false,
        resolved_by: null,
        resolved_by_name: null,
        resolved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_count: 1,
        replies: [
            {
                id: '2',
                blog_post_id: 'post-1',
                parent_comment_id: '1',
                author_id: 'user-2',
                author_name: 'Jane Smith',
                author_role: 'client',
                content: 'This is a reply to the first comment',
                mentioned_user_ids: [],
                is_resolved: false,
                resolved_by: null,
                resolved_by_name: null,
                resolved_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                reply_count: 0,
                replies: []
            }
        ]
    },
    {
        id: '3',
        blog_post_id: 'post-1',
        parent_comment_id: null,
        author_id: 'user-3',
        author_name: 'Bob Wilson',
        author_role: 'admin',
        content: 'This is a resolved comment',
        mentioned_user_ids: [],
        is_resolved: true,
        resolved_by: 'user-1',
        resolved_by_name: 'John Doe',
        resolved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_count: 0,
        replies: []
    }
];

describe('ThreadedComments Component', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ comments: mockComments })
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('renders comments list', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });
    });

    test('displays author information', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('editor')).toBeInTheDocument();
        });
    });

    test('shows nested replies with indentation', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a reply to the first comment')).toBeInTheDocument();
        });

        // Check that reply appears after parent comment
        const comments = screen.getAllByRole('article');
        expect(comments.length).toBeGreaterThanOrEqual(2);
    });

    test('displays resolved status', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText(/resolved/i)).toBeInTheDocument();
        });
    });

    test('handles reply button click', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });

        const replyButtons = screen.getAllByRole('button', { name: /reply/i });
        fireEvent.click(replyButtons[0]);

        // Reply form should appear
        await waitFor(() => {
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });
    });

    test('submits new comment', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ comments: mockComments })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ comment: { id: '4', content: 'New comment' } })
            });

        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });

        // Find and fill comment input
        const commentInput = screen.getByRole('textbox', { name: /add.*comment/i });
        fireEvent.change(commentInput, { target: { value: 'New test comment' } });

        // Submit comment
        const submitButton = screen.getByRole('button', { name: /submit|post/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/comments'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('New test comment')
                })
            );
        });
    });

    test('resolves comment thread', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ comments: mockComments })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });

        // Find resolve button (might be in a dropdown menu)
        const resolveButtons = screen.getAllByRole('button', { name: /resolve/i });
        if (resolveButtons.length > 0) {
            fireEvent.click(resolveButtons[0]);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/comments'),
                    expect.objectContaining({
                        method: 'PATCH'
                    })
                );
            });
        }
    });

    test('unresolves comment thread', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a resolved comment')).toBeInTheDocument();
        });

        // Find unresolve button for resolved comment
        const unresolveButtons = screen.getAllByRole('button', { name: /unresolve|reopen/i });
        if (unresolveButtons.length > 0) {
            fireEvent.click(unresolveButtons[0]);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
            });
        }
    });

    test('displays relative timestamps', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
        });
    });

    test('handles loading state', () => {
        (global.fetch as jest.Mock).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        render(<ThreadedComments postId="post-1" />);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('handles error state', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to load comments'));

        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
        });
    });

    test('shows empty state when no comments', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ comments: [] })
        });

        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText(/no comments/i)).toBeInTheDocument();
        });
    });

    test('collapses and expands reply threads', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a reply to the first comment')).toBeInTheDocument();
        });

        // Find collapse button
        const collapseButtons = screen.getAllByRole('button', { name: /collapse|hide/i });
        if (collapseButtons.length > 0) {
            fireEvent.click(collapseButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('This is a reply to the first comment')).not.toBeVisible();
            });

            // Expand again
            const expandButtons = screen.getAllByRole('button', { name: /expand|show/i });
            if (expandButtons.length > 0) {
                fireEvent.click(expandButtons[0]);

                await waitFor(() => {
                    expect(screen.getByText('This is a reply to the first comment')).toBeVisible();
                });
            }
        }
    });

    test('displays reply count', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText(/1.*reply|replies/i)).toBeInTheDocument();
        });
    });

    test('supports mentions in comments', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ comments: mockComments })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ comment: { id: '5', content: '@jane check this' } })
            });

        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });

        // Type comment with mention
        const commentInput = screen.getByRole('textbox', { name: /add.*comment/i });
        fireEvent.change(commentInput, { target: { value: '@jane check this out' } });

        const submitButton = screen.getByRole('button', { name: /submit|post/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    test('validates empty comment submission', async () => {
        render(<ThreadedComments postId="post-1" />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });

        // Try to submit empty comment
        const submitButton = screen.getByRole('button', { name: /submit|post/i });
        fireEvent.click(submitButton);

        // Should show validation error
        await waitFor(() => {
            expect(screen.getByText(/cannot.*empty|required/i)).toBeInTheDocument();
        });
    });

    test('calls onRefresh when provided', async () => {
        const onRefresh = jest.fn();

        render(<ThreadedComments postId="post-1" onRefresh={onRefresh} />);

        await waitFor(() => {
            expect(screen.getByText('This is a top-level comment')).toBeInTheDocument();
        });

        // Trigger refresh
        const refreshButton = screen.queryByRole('button', { name: /refresh/i });
        if (refreshButton) {
            fireEvent.click(refreshButton);
            expect(onRefresh).toHaveBeenCalled();
        }
    });
});
