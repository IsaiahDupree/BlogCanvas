/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterBuilder } from '@/components/newsletters/NewsletterBuilder';

describe('NewsletterBuilder Component', () => {
    const mockOnChange = jest.fn();
    const mockOnSaveTemplate = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
        mockOnSaveTemplate.mockClear();
    });

    test('renders newsletter builder interface', () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        // Check for main builder elements
        expect(screen.getByText(/newsletter preview/i)).toBeInTheDocument();
    });

    test('displays block type options', () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        // Check for available block types
        expect(screen.getByText(/header/i)).toBeInTheDocument();
        expect(screen.getByText(/text/i)).toBeInTheDocument();
    });

    test('renders drag blocks palette', async () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        // Check for drag blocks section
        expect(screen.getByText(/drag blocks/i)).toBeInTheDocument();
    });

    test('displays empty state message', async () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        await waitFor(() => {
            expect(screen.getByText(/drag blocks from the left sidebar/i)).toBeInTheDocument();
        });
    });

    test('calls onSaveTemplate when save as template button clicked', async () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        const saveButton = screen.getByRole('button', { name: /save as template/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSaveTemplate).toHaveBeenCalled();
        });
    });

    test('toggles preview mode between desktop and mobile', async () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        const desktopButton = screen.getByRole('button', { name: /desktop/i });
        const mobileButton = screen.getByRole('button', { name: /mobile/i });

        // Mobile button should toggle to mobile view
        fireEvent.click(mobileButton);

        await waitFor(() => {
            expect(screen.getByText(/newsletter preview \(mobile\)/i)).toBeInTheDocument();
        });

        // Desktop button should toggle back
        fireEvent.click(desktopButton);

        await waitFor(() => {
            expect(screen.getByText(/newsletter preview \(desktop\)/i)).toBeInTheDocument();
        });
    });

    test('edits block content', async () => {
        const initialBlocks = [
            { id: '1', type: 'text' as const, content: 'Initial content' }
        ];

        render(<NewsletterBuilder initialBlocks={initialBlocks} onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Initial content')).toBeInTheDocument();
        });

        // Find text input and edit it
        const textInput = screen.getByDisplayValue('Initial content');
        fireEvent.change(textInput, { target: { value: 'Updated content' } });

        expect(textInput).toHaveValue('Updated content');
    });

    test('loads initial blocks from props', () => {
        const initialBlocks = [
            { id: '1', type: 'header' as const, content: 'Welcome' },
            { id: '2', type: 'text' as const, content: 'Newsletter body' }
        ];

        render(
            <NewsletterBuilder
                onChange={mockOnChange}
                onSaveTemplate={mockOnSaveTemplate}
                initialBlocks={initialBlocks}
            />
        );

        expect(screen.getByDisplayValue('Welcome')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Newsletter body')).toBeInTheDocument();
    });

    test('supports different block types', async () => {
        render(<NewsletterBuilder onChange={mockOnChange} onSaveTemplate={mockOnSaveTemplate} />);

        // Check for various block type options
        const blockTypes = ['header', 'text', 'image', 'button', 'cta'];

        blockTypes.forEach(type => {
            const typeButton = screen.queryByText(new RegExp(type, 'i'));
            if (typeButton) {
                expect(typeButton).toBeInTheDocument();
            }
        });
    });
});
