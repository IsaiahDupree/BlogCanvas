import { render, screen, fireEvent } from '@testing-library/react';
import PortalPostReviewPage from '@/app/portal/posts/[postId]/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

describe('Client Portal - Post Review Page', () => {
    const mockParams = Promise.resolve({ postId: '1' });

    it('renders post review page with title and content', () => {
        render(<PortalPostReviewPage params={mockParams} />);

        expect(screen.getByText('How AI CRM Transforms Sales Processes')).toBeInTheDocument();
        expect(screen.getByText('Needs Your Review')).toBeInTheDocument();
    });

    it('shows approve and request changes buttons', () => {
        render(<PortalPostReviewPage params={mockParams} />);

        const approveButton = screen.getByRole('button', { name: /approve post/i });
        const requestChangesButton = screen.getByRole('button', { name: /request changes/i });

        expect(approveButton).toBeInTheDocument();
        expect(requestChangesButton).toBeInTheDocument();
    });

    it('opens change request modal when request changes is clicked', () => {
        render(<PortalPostReviewPage params={mockParams} />);

        const requestChangesButton = screen.getByRole('button', { name: /request changes/i });
        fireEvent.click(requestChangesButton);

        expect(screen.getByText(/describe what needs to be changed/i)).toBeInTheDocument();
    });

    it('displays comments section', () => {
        render(<PortalPostReviewPage params={mockParams} />);

        expect(screen.getByText(/comments/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    });

    it('shows review tasks if present', () => {
        render(<PortalPostReviewPage params={mockParams} />);

        expect(screen.getByText(/needs your input/i)).toBeInTheDocument();
        expect(screen.getByText(/can you provide a specific customer success story/i)).toBeInTheDocument();
    });

    it('displays post metadata (keyword, read time, publish date)', () => {
        render(<PortalPostReviewPage params={mockParams} />);

        expect(screen.getByText(/AI CRM/i)).toBeInTheDocument();
        expect(screen.getByText(/8 min read/i)).toBeInTheDocument();
        expect(screen.getByText(/December 10, 2024/i)).toBeInTheDocument();
    });
});
