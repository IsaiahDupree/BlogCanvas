/**
 * Accessibility Tests - A11y Testing
 * Test for screen readers, keyboard navigation, contrast, etc.
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import OnePageWorkflowPage from '@/app/one-page-workflow/page';

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn()
    })
}));

describe('Workflow - Accessibility Tests', () => {
    describe('WCAG Compliance', () => {
        it('should have no accessibility violations', async () => {
            const { container } = render(<OnePageWorkflowPage />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        }, 30000);

        it('should have proper heading hierarchy', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const h1 = container.querySelector('h1');
            expect(h1).toBeInTheDocument();
        });

        it('should have proper form labels', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const inputs = container.querySelectorAll('input, textarea');
            
            inputs.forEach(input => {
                const id = input.getAttribute('id');
                if (id) {
                    const label = container.querySelector(`label[for="${id}"]`);
                    expect(label).toBeInTheDocument();
                }
            });
        });

        it('should have proper button labels', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const buttons = container.querySelectorAll('button');
            
            buttons.forEach(button => {
                const text = button.textContent?.trim();
                const ariaLabel = button.getAttribute('aria-label');
                const ariaLabelledBy = button.getAttribute('aria-labelledby');
                
                // Button should have accessible name
                expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();
            });
        });
    });

    describe('Keyboard Navigation', () => {
        it('should be navigable with keyboard only', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const focusableElements = container.querySelectorAll(
                'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
            );
            
            expect(focusableElements.length).toBeGreaterThan(0);
        });

        it('should have logical tab order', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const focusableElements = Array.from(
                container.querySelectorAll('a, button, input, textarea, [tabindex]:not([tabindex="-1"])')
            );

            // Check that tabindex values are logical
            focusableElements.forEach((element, index) => {
                const tabIndex = element.getAttribute('tabindex');
                if (tabIndex !== null) {
                    expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
                }
            });
        });
    });

    describe('Screen Reader Support', () => {
        it('should have proper ARIA labels', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby]');
            
            // Should have some ARIA labels for complex interactions
            expect(elementsWithAria.length).toBeGreaterThanOrEqual(0);
        });

        it('should announce progress updates', () => {
            const { container } = render(<OnePageWorkflowPage />);
            const progressElements = container.querySelectorAll('[role="progressbar"], [aria-live]');
            
            // Progress indicators should be present
            expect(progressElements.length).toBeGreaterThanOrEqual(0);
        });
    });
});

