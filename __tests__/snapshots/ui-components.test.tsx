/**
 * Snapshot Tests for UI Components
 * feat-026: Snapshot critical components
 *
 * Ensures UI components maintain consistent rendering across changes
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

describe('UI Component Snapshots', () => {
  describe('Button', () => {
    it('renders default button', () => {
      const { container } = render(<Button>Click Me</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders primary variant', () => {
      const { container } = render(<Button variant="default">Primary</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders destructive variant', () => {
      const { container } = render(<Button variant="destructive">Delete</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders outline variant', () => {
      const { container } = render(<Button variant="outline">Outline</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders disabled button', () => {
      const { container } = render(<Button disabled>Disabled</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders small size', () => {
      const { container } = render(<Button size="sm">Small</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders large size', () => {
      const { container } = render(<Button size="lg">Large</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Card', () => {
    it('renders basic card', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card without description', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content</p>
          </CardContent>
        </Card>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Badge', () => {
    it('renders default badge', () => {
      const { container } = render(<Badge>Default</Badge>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders secondary badge', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders destructive badge', () => {
      const { container } = render(<Badge variant="destructive">Error</Badge>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders outline badge', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Alert', () => {
    it('renders default alert', () => {
      const { container } = render(
        <Alert>
          <p>This is an alert message</p>
        </Alert>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders destructive alert', () => {
      const { container } = render(
        <Alert variant="destructive">
          <p>This is an error alert</p>
        </Alert>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Input', () => {
    it('renders default input', () => {
      const { container } = render(<Input placeholder="Enter text" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders disabled input', () => {
      const { container } = render(<Input disabled placeholder="Disabled" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders input with type', () => {
      const { container } = render(<Input type="email" placeholder="Email" />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
