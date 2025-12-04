import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
        };
    },
    usePathname() {
        return '';
    },
    useSearchParams() {
        return new URLSearchParams();
    },
}));

// Mock Next.js link
jest.mock('next/link', () => {
    return ({ children, href }: any) => {
        return <a href={href}>{children}</a>;
    };
});

// Global fetch mock
global.fetch = jest.fn();
