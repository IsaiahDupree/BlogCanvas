'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, FileCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface EditorSignOffToggleProps {
  postId: string
  onSignOffChange?: (signedOff: boolean) => void
}

export default function EditorSignOffToggle({
  postId,
  onSignOffChange
}: EditorSignOffToggleProps) {
  const [signedOff, setSignedOff] = useState(false)
  const [signedOffAt, setSignedOffAt] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNotesInput, setShowNotesInput] = useState(false)

  useEffect(() => {
    fetchSignOffStatus()
  }, [postId])

  const fetchSignOffStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/blog-posts/${postId}/editor-sign-off`)
      const data = await response.json()

      if (data.success) {
        setSignedOff(data.signOff.signedOff)
        setSignedOffAt(data.signOff.signedOffAt)
        setNotes(data.signOff.notes || '')
      }
    } catch (error) {
      console.error('Failed to fetch sign-off status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSignOff = async () => {
    // If signing off and notes input is not shown, show it first
    if (!signedOff && !showNotesInput) {
      setShowNotesInput(true)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/blog-posts/${postId}/editor-sign-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedOff: !signedOff,
          notes: !signedOff ? notes : null
        })
      })

      const data = await response.json()

      if (data.success) {
        setSignedOff(!signedOff)
        setSignedOffAt(!signedOff ? new Date().toISOString() : null)
        if (!signedOff) {
          setShowNotesInput(false)
        } else {
          setNotes('')
        }

        if (onSignOffChange) {
          onSignOffChange(!signedOff)
        }

        // Show success message
        alert(data.message)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to toggle sign-off:', error)
      alert('Failed to update sign-off status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowNotesInput(false)
    setNotes('')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={signedOff ? 'border-green-200 bg-green-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className={`w-5 h-5 ${signedOff ? 'text-green-600' : 'text-gray-400'}`} />
            <CardTitle className="text-lg">Editor Sign-Off</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={signedOff
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-gray-100 text-gray-600 border-gray-300'
            }
          >
            {signedOff ? 'Approved for Client' : 'Pending Review'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sign-off status */}
        <div className="space-y-2">
          {signedOff && signedOffAt && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Clock className="w-4 h-4" />
              <span>
                Signed off on {new Date(signedOffAt).toLocaleString()}
              </span>
            </div>
          )}

          {signedOff && notes && (
            <div className="p-3 bg-white rounded-md border border-green-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Sign-off Notes:</p>
              <p className="text-sm text-gray-800">{notes}</p>
            </div>
          )}

          {/* Notes input when signing off */}
          {!signedOff && showNotesInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sign-off Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this sign-off..."
                rows={3}
                className="text-sm"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!signedOff && !showNotesInput && (
            <Button
              onClick={handleToggleSignOff}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Sign Off for Client Review
                </>
              )}
            </Button>
          )}

          {!signedOff && showNotesInput && (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleToggleSignOff}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing Off...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Sign-Off
                  </>
                )}
              </Button>
            </>
          )}

          {signedOff && (
            <Button
              onClick={handleToggleSignOff}
              disabled={submitting}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Remove Sign-Off
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500">
          {signedOff
            ? 'This post is approved for client review. Remove sign-off if revisions are needed.'
            : 'Sign off on this post to mark it ready for client approval.'}
        </p>
      </CardContent>
    </Card>
  )
}
