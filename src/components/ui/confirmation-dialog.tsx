'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="confirmation-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && (
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription id="confirmation-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading || loading}
          >
            {isLoading || loading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook for managing confirmation dialogs
 */
export function useConfirmation() {
  const [state, setState] = React.useState<{
    open: boolean
    props?: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>
  }>({
    open: false,
  })

  const confirm = React.useCallback(
    (props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          props: {
            ...props,
            onConfirm: async () => {
              await props.onConfirm()
              resolve(true)
            },
          },
        })
      })
    },
    []
  )

  const ConfirmationDialogComponent = React.useMemo(() => {
    if (!state.open || !state.props) return null

    return (
      <ConfirmationDialog
        open={state.open}
        onOpenChange={(open) => setState({ open })}
        {...state.props}
      />
    )
  }, [state])

  return { confirm, ConfirmationDialog: ConfirmationDialogComponent }
}
