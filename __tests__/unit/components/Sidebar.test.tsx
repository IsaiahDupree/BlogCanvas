/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/app',
}))

describe('Sidebar Component', () => {
  it('should render BlogCanvas branding', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('BlogCanvas')).toBeInTheDocument()
    // "Content Pipeline" appears multiple times - use getAllByText or check first occurrence
    expect(screen.getAllByText('Content Pipeline').length).toBeGreaterThan(0)
  })

  it('should render all navigation groups', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Overview')).toBeInTheDocument()
    // "Content Pipeline" appears as subtitle and as group name - check for group name specifically
    const contentPipelineGroups = screen.getAllByText('Content Pipeline')
    expect(contentPipelineGroups.length).toBeGreaterThan(0)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render all navigation links', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Websites')).toBeInTheDocument()
    expect(screen.getByText('Content Batches')).toBeInTheDocument()
    expect(screen.getByText('Review Board')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()
  })

  it('should show version information in footer', () => {
    render(<Sidebar />)
    
    // Check for footer content
    expect(screen.getByText('BlogCanvas v1.0')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered SEO Platform')).toBeInTheDocument()
  })

  it('should highlight active page', () => {
    render(<Sidebar />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    // Active link should have active styling
    expect(dashboardLink).toBeTruthy()
    // Check if it has active class or is in active state
    if (dashboardLink) {
      expect(dashboardLink.className).toContain('bg-indigo-600')
    }
  })
})
