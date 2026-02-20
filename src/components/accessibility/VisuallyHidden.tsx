/**
 * Visually Hidden Component
 *
 * Hides content visually but keeps it accessible to screen readers.
 * Uses .sr-only utility class from Tailwind CSS.
 */

interface VisuallyHiddenProps {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>
}
