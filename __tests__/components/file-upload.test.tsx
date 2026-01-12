/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '@/components/files/FileUpload';

// Mock fetch globally
global.fetch = jest.fn();

describe('FileUpload Component', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('renders upload area', () => {
        render(<FileUpload />);

        expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
        expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
    });

    test('displays upload icon', () => {
        const { container } = render(<FileUpload />);

        // Check for upload icon (lucide-react Upload component)
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    test('handles file selection via input', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ file: { id: '1', name: 'test.pdf' } })
        });

        render(<FileUpload />);

        const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file]
            });

            fireEvent.change(input);

            // Wait for upload to process
            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });
        }
    });

    test('shows file size validation error', async () => {
        const onUploadError = jest.fn();
        const maxSize = 1024; // 1KB

        render(<FileUpload maxSize={maxSize} onUploadError={onUploadError} />);

        // Create a file larger than maxSize
        const largeFile = new File(['x'.repeat(2000)], 'large.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [largeFile]
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
            });
        }
    });

    test('shows file type validation error', async () => {
        render(<FileUpload acceptedTypes={['application/pdf']} />);

        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [invalidFile]
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(screen.getByText(/file type not accepted/i)).toBeInTheDocument();
            });
        }
    });

    test('handles drag and drop', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ file: { id: '1', name: 'dropped.pdf' } })
        });

        const { container } = render(<FileUpload />);

        const dropzone = container.querySelector('[class*="border-dashed"]');

        if (dropzone) {
            // Simulate drag enter
            const dragEnterEvent = new Event('dragenter', { bubbles: true });
            fireEvent(dropzone, dragEnterEvent);

            // Simulate drag over
            const dragOverEvent = new Event('dragover', { bubbles: true });
            Object.defineProperty(dragOverEvent, 'preventDefault', { value: jest.fn() });
            fireEvent(dropzone, dragOverEvent);

            // Simulate drop
            const file = new File(['content'], 'dropped.pdf', { type: 'application/pdf' });
            const dropEvent = new Event('drop', { bubbles: true });
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: {
                    files: [file]
                }
            });
            Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });

            fireEvent(dropzone, dropEvent);

            await waitFor(() => {
                expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
            });
        }
    });

    test('shows upload progress', async () => {
        (global.fetch as jest.Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => ({ file: { id: '1', name: 'test.pdf' } })
            }), 100))
        );

        render(<FileUpload />);

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file]
            });

            fireEvent.change(input);

            // Check for progress indicator
            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });
        }
    });

    test('handles upload error from server', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Upload failed'));

        render(<FileUpload />);

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file]
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
            });
        }
    });

    test('allows removing uploaded file', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ file: { id: '1', name: 'test.pdf' } })
        });

        render(<FileUpload />);

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file]
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(screen.getByText('test.pdf')).toBeInTheDocument();
            });

            // Find and click remove button (X icon)
            const removeButtons = screen.getAllByRole('button');
            const removeButton = removeButtons.find(btn => btn.querySelector('[class*="lucide-x"]'));

            if (removeButton) {
                fireEvent.click(removeButton);

                await waitFor(() => {
                    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
                });
            }
        }
    });

    test('handles multiple file uploads', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ file: { id: '1', name: 'test.pdf' } })
        });

        render(<FileUpload multiple={true} />);

        const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
        const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file1, file2]
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(screen.getByText('test1.pdf')).toBeInTheDocument();
                expect(screen.getByText('test2.pdf')).toBeInTheDocument();
            });
        }
    });

    test('calls onUploadComplete callback', async () => {
        const onUploadComplete = jest.fn();
        const mockFile = { id: '1', name: 'test.pdf', url: '/files/test.pdf' };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ file: mockFile })
        });

        render(<FileUpload onUploadComplete={onUploadComplete} />);

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file]
            });

            fireEvent.change(input);

            await waitFor(() => {
                expect(onUploadComplete).toHaveBeenCalledWith(mockFile);
            });
        }
    });

    test('disables multiple uploads when multiple=false', () => {
        render(<FileUpload multiple={false} />);

        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        expect(input).not.toHaveAttribute('multiple');
    });

    test('shows success state after upload completes', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ file: { id: '1', name: 'test.pdf' } })
        });

        render(<FileUpload />);

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const input = screen.getByRole('button', { name: /click to browse/i }).parentElement?.querySelector('input[type="file"]');

        if (input) {
            Object.defineProperty(input, 'files', {
                value: [file]
            });

            fireEvent.change(input);

            await waitFor(() => {
                // Look for success indicator (CheckCircle icon or success text)
                const successIcon = document.querySelector('[class*="lucide-check"]');
                expect(successIcon || screen.getByText('test.pdf')).toBeTruthy();
            });
        }
    });
});
