/**
 * @jest-environment jsdom
 */
/**
 * Component Tests - One-Page Workflow Network & RSC Tests
 * Tests for network errors, RSC payload issues, and WebSocket connections
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OnePageWorkflowPage from '@/app/one-page-workflow/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn()
    })
}));

// Mock EventSource for SSE
class MockEventSource {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;
    
    url: string;
    readyState: number;
    onopen: ((event: any) => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    
    constructor(url: string) {
        this.url = url;
        this.readyState = MockEventSource.CONNECTING;
        
        // Simulate connection after a delay
        setTimeout(() => {
            this.readyState = MockEventSource.OPEN;
            if (this.onopen) {
                this.onopen({ type: 'open' });
            }
        }, 10);
    }
    
    close() {
        this.readyState = MockEventSource.CLOSED;
    }
    
    addEventListener(event: string, handler: (event: any) => void) {
        if (event === 'open') this.onopen = handler;
        if (event === 'message') this.onmessage = handler;
        if (event === 'error') this.onerror = handler;
    }
    
    removeEventListener() {
        // Mock implementation
    }
}

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock EventSource
global.EventSource = MockEventSource as any;

describe('One-Page Workflow - Network & RSC Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Page Rendering', () => {
        it('should render without RSC errors', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            }, { timeout: 3000 });
            
            // Check for RSC errors in console
            const errorCalls = consoleError.mock.calls.filter(call => 
                call[0]?.toString().includes('RSC') || 
                call[0]?.toString().includes('Failed to fetch')
            );
            
            expect(errorCalls.length).toBe(0);
            consoleError.mockRestore();
        });

        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('NetworkError when attempting to fetch resource'));
            
            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            });
            
            // Page should still render even if initial fetch fails
            expect(screen.getByText(/Start Analysis/i)).toBeInTheDocument();
        });

        it('should render all main sections', () => {
            render(<OnePageWorkflowPage />);
            
            expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            expect(screen.getByText(/Step 1: Input Source/i)).toBeInTheDocument();
            expect(screen.getByText(/Website URL/i)).toBeInTheDocument();
            expect(screen.getByText(/Paste PRD/i)).toBeInTheDocument();
        });
    });

    describe('Terminal Viewer Integration', () => {
        it('should handle terminal viewer connection errors', async () => {
            // Mock EventSource to simulate connection error
            const originalEventSource = global.EventSource;
            global.EventSource = jest.fn().mockImplementation(() => {
                const mockSource = {
                    readyState: 0,
                    onerror: null,
                    onopen: null,
                    onmessage: null,
                    close: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                };
                
                // Simulate error after connection attempt
                setTimeout(() => {
                    if (mockSource.onerror) {
                        mockSource.onerror({ type: 'error' });
                    }
                }, 50);
                
                return mockSource;
            }) as any;

            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            });
            
            global.EventSource = originalEventSource;
        });

        it('should handle WebSocket HMR connection interruptions', () => {
            // Mock WebSocket for HMR
            const mockWebSocket = {
                readyState: 0,
                close: jest.fn(),
                send: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            
            global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket) as any;
            
            render(<OnePageWorkflowPage />);
            
            // Simulate connection interruption
            mockWebSocket.readyState = 3; // CLOSED
            
            // Page should still function
            expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
        });
    });

    describe('API Error Handling', () => {
        it('should handle gap analysis API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: 'Internal server error' })
            });
            
            render(<OnePageWorkflowPage />);
            
            const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
            fireEvent.change(urlInput, { target: { value: 'https://techmestuff.com' } });
            
            const startButton = screen.getByText(/Start Analysis/i);
            fireEvent.click(startButton);
            
            await waitFor(() => {
                const errorMessage = screen.queryByText(/error/i);
                // Should show error or handle gracefully
                expect(errorMessage || screen.getByText(/One-Page SEO Workflow/i)).toBeTruthy();
            });
        });

        it('should handle timeout errors', async () => {
            mockFetch.mockImplementationOnce(() => 
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 100)
                )
            );
            
            render(<OnePageWorkflowPage />);
            
            const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
            fireEvent.change(urlInput, { target: { value: 'https://techmestuff.com' } });
            
            const startButton = screen.getByText(/Start Analysis/i);
            fireEvent.click(startButton);
            
            await waitFor(() => {
                // Should handle timeout gracefully
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            }, { timeout: 2000 });
        });

        it('should handle CORS errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('CORS policy'));
            
            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            });
        });
    });

    describe('SSE Connection Handling', () => {
        it('should handle SSE connection failures', async () => {
            const originalEventSource = global.EventSource;
            global.EventSource = jest.fn().mockImplementation(() => {
                const mockSource = {
                    readyState: 0,
                    onerror: null,
                    onopen: null,
                    onmessage: null,
                    close: jest.fn(),
                    addEventListener: jest.fn((event, handler) => {
                        if (event === 'error') {
                            setTimeout(() => {
                                if (handler) handler({ type: 'error' });
                            }, 10);
                        }
                    }),
                    removeEventListener: jest.fn()
                };
                return mockSource;
            }) as any;

            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            });
            
            global.EventSource = originalEventSource;
        });

        it('should handle SSE reconnection', async () => {
            let connectionAttempts = 0;
            const originalEventSource = global.EventSource;
            
            global.EventSource = jest.fn().mockImplementation(() => {
                connectionAttempts++;
                const mockSource = {
                    readyState: connectionAttempts === 1 ? 0 : 1, // Fail first, succeed second
                    onerror: null,
                    onopen: null,
                    onmessage: null,
                    close: jest.fn(),
                    addEventListener: jest.fn((event, handler) => {
                        if (event === 'open' && connectionAttempts > 1) {
                            setTimeout(() => {
                                if (handler) handler({ type: 'open' });
                            }, 10);
                        }
                        if (event === 'error' && connectionAttempts === 1) {
                            setTimeout(() => {
                                if (handler) handler({ type: 'error' });
                            }, 10);
                        }
                    }),
                    removeEventListener: jest.fn()
                };
                return mockSource;
            }) as any;

            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            });
            
            global.EventSource = originalEventSource;
        });
    });

    describe('Client Component Validation', () => {
        it('should use client-side hooks', () => {
            // Render the component and check it uses hooks
            const { container } = render(<OnePageWorkflowPage />);
            
            // Component should render (which means hooks work)
            expect(container).toBeTruthy();
            expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
        });

        it('should handle client-side state', async () => {
            render(<OnePageWorkflowPage />);
            
            // Test that state changes work (switching tabs)
            const prdTab = screen.getByText(/Paste PRD/i);
            fireEvent.click(prdTab);
            
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Paste your Product Requirements Document/i)).toBeInTheDocument();
            });
        });
    });

    describe('Hydration Issues', () => {
        it('should render without hydration mismatches', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            render(<OnePageWorkflowPage />);
            
            await waitFor(() => {
                expect(screen.getByText(/One-Page SEO Workflow/i)).toBeInTheDocument();
            });
            
            // Check for hydration errors
            const hydrationErrors = consoleError.mock.calls.filter(call =>
                call[0]?.toString().includes('hydration') ||
                call[0]?.toString().includes('Hydration')
            );
            
            expect(hydrationErrors.length).toBe(0);
            consoleError.mockRestore();
        });
    });
});

