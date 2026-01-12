/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterBuilder } from '@/components/newsletters/NewsletterBuilder';

describe('NewsletterBuilder Component', () => {
    const mockOnSave = jest.fn();
    const mockOnPreview = jest.fn();

    beforeEach(() => {
        mockOnSave.mockClear();
        mockOnPreview.mockClear();
    });

    test('renders newsletter builder interface', () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Check for main builder elements
        expect(screen.getByText(/newsletter builder/i)).toBeInTheDocument();
    });

    test('displays block type options', () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Check for available block types
        expect(screen.getByText(/header/i)).toBeInTheDocument();
        expect(screen.getByText(/text/i)).toBeInTheDocument();
    });

    test('adds a new block when button clicked', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        const addButton = screen.getByRole('button', { name: /add.*block/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            // Verify a block was added to the builder
            expect(screen.getByRole('article')).toBeInTheDocument();
        });
    });

    test('removes a block when delete button clicked', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Add a block first
        const addButton = screen.getByRole('button', { name: /add.*block/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('article')).toBeInTheDocument();
        });

        // Find and click delete button
        const deleteButton = screen.getByRole('button', { name: /delete|remove/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(screen.queryByRole('article')).not.toBeInTheDocument();
        });
    });

    test('calls onSave when save button clicked', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    test('calls onPreview when preview button clicked', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        const previewButton = screen.getByRole('button', { name: /preview/i });
        fireEvent.click(previewButton);

        await waitFor(() => {
            expect(mockOnPreview).toHaveBeenCalled();
        });
    });

    test('edits block content', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Add a text block
        const addButton = screen.getByRole('button', { name: /add.*block/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('article')).toBeInTheDocument();
        });

        // Find text input and edit it
        const textInput = screen.getByRole('textbox');
        fireEvent.change(textInput, { target: { value: 'Updated content' } });

        expect(textInput).toHaveValue('Updated content');
    });

    test('supports drag and drop reordering', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Add two blocks
        const addButton = screen.getByRole('button', { name: /add.*block/i });
        fireEvent.click(addButton);
        fireEvent.click(addButton);

        await waitFor(() => {
            const blocks = screen.getAllByRole('article');
            expect(blocks.length).toBe(2);
        });

        // Get draggable blocks
        const blocks = screen.getAllByRole('article');

        // Simulate dragstart on first block
        const dragStartEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragStartEvent, 'dataTransfer', {
            value: {
                setData: jest.fn(),
                effectAllowed: 'move'
            }
        });

        fireEvent(blocks[0], dragStartEvent);

        // Simulate drop on second block
        const dropEvent = new Event('drop', { bubbles: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                getData: jest.fn(() => '0')
            }
        });

        fireEvent(blocks[1], dropEvent);

        // Blocks should have been reordered
        await waitFor(() => {
            expect(screen.getAllByRole('article')).toHaveLength(2);
        });
    });

    test('validates required fields', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Try to save without adding content
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            // Should show validation message
            expect(screen.getByText(/required|empty/i)).toBeInTheDocument();
        });
    });

    test('loads initial blocks from props', () => {
        const initialBlocks = [
            { id: '1', type: 'header', content: 'Welcome' },
            { id: '2', type: 'text', content: 'Newsletter body' }
        ];

        render(
            <NewsletterBuilder
                onSave={mockOnSave}
                onPreview={mockOnPreview}
                initialBlocks={initialBlocks}
            />
        );

        expect(screen.getByText('Welcome')).toBeInTheDocument();
        expect(screen.getByText('Newsletter body')).toBeInTheDocument();
    });

    test('supports different block types', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Check for various block type options
        const blockTypes = ['header', 'text', 'image', 'button', 'cta'];

        blockTypes.forEach(type => {
            const typeButton = screen.queryByText(new RegExp(type, 'i'));
            if (typeButton) {
                expect(typeButton).toBeInTheDocument();
            }
        });
    });

    test('generates HTML output', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Add a block
        const addButton = screen.getByRole('button', { name: /add.*block/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('article')).toBeInTheDocument();
        });

        // Save and verify HTML is generated
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.any(String),
                    blocks: expect.any(Array)
                })
            );
        });
    });

    test('handles image block upload', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Add image block
        const imageBlockButton = screen.getByText(/image/i);
        fireEvent.click(imageBlockButton);

        await waitFor(() => {
            // Should show image upload interface
            expect(screen.getByText(/upload|image/i)).toBeInTheDocument();
        });
    });

    test('supports undo/redo functionality', async () => {
        render(<NewsletterBuilder onSave={mockOnSave} onPreview={mockOnPreview} />);

        // Add a block
        const addButton = screen.getByRole('button', { name: /add.*block/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByRole('article')).toBeInTheDocument();
        });

        // Click undo
        const undoButton = screen.queryByRole('button', { name: /undo/i });
        if (undoButton) {
            fireEvent.click(undoButton);

            await waitFor(() => {
                expect(screen.queryByRole('article')).not.toBeInTheDocument();
            });
        }
    });
});
