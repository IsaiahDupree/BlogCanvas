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
    expect(screen.getByText('Content Pipeline')).toBeInTheDocument()
  })

  it('should render all navigation groups', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Content Pipeline')).toBeInTheDocument()
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
    
    expect(screen.getByText('BlogCanvas v1.0')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered SEO Platform')).toBeInTheDocument()
  })

  it('should highlight active page', () => {
    render(<Sidebar />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-indigo-600')
  })
})
