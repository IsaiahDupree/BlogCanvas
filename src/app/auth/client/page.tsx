'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface InvitationData {
    email: string
    role: string
    client: {
        id: string
        name: string
        website_url?: string
    }
}

function ClientInvitationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [validating, setValidating] = useState(true)
    const [invitation, setInvitation] = useState<InvitationData | null>(null)
    const [error, setError] = useState('')

    // Form state
    const [fullName, setFullName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setError('No invitation token provided')
            setValidating(false)
            return
        }

        validateToken()
    }, [token])

    const validateToken = async () => {
        try {
            const response = await fetch(`/api/auth/client-invite?token=${token}`)
            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Invalid invitation')
                setValidating(false)
                return
            }

            setInvitation(data.invitation)
            setValidating(false)
        } catch (err: any) {
            setError('Failed to validate invitation')
            setValidating(false)
        }
    }

    const handleAcceptInvitation = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!fullName.trim()) {
            setError('Please enter your full name')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (!invitation) {
            setError('Invalid invitation')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/accept-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    email: invitation.email,
                    password: password,
                    fullName: fullName
                })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Failed to create account')
                setLoading(false)
                return
            }

            setSuccess(true)

            // Redirect to portal after brief delay
            setTimeout(() => {
                router.push(data.redirectUrl || '/portal/dashboard')
                router.refresh()
            }, 2000)

        } catch (err: any) {
            setError(err.message || 'An error occurred')
            setLoading(false)
        }
    }

    // Loading state
    if (validating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
                <Card className="p-8 bg-white shadow-2xl max-w-md w-full">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
                        <p className="text-gray-600">Validating invitation...</p>
                    </div>
                </Card>
            </div>
        )
    }

    // Error state (invalid token)
    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
                <Card className="p-8 bg-white shadow-2xl max-w-md w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Go to Login
                        </Link>
                    </div>
                </Card>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
                <Card className="p-8 bg-white shadow-2xl max-w-md w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BlogCanvas!</h2>
                        <p className="text-gray-600 mb-2">Your account has been created successfully.</p>
                        <p className="text-sm text-gray-500">Redirecting you to the portal...</p>
                    </div>
                </Card>
            </div>
        )
    }

    // Main invitation acceptance form
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo / Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">BlogCanvas</h1>
                    <p className="text-indigo-100">Client Portal Access</p>
                </div>

                <Card className="p-8 bg-white shadow-2xl">
                    <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">You're Invited!</h2>
                        <p className="text-center text-gray-600 mb-4">
                            You've been invited to join <span className="font-semibold">{invitation?.client.name}</span> on BlogCanvas
                        </p>
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Email:</span> {invitation?.email}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                <span className="font-medium">Role:</span> {invitation?.role === 'client_admin' ? 'Administrator' : 'Reviewer'}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAcceptInvitation} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => {
                                        setFullName(e.target.value)
                                        setError('')
                                    }}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError('')
                                    }}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                    minLength={8}
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
                                        setError('')
                                    }}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Accept Invitation
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        By creating an account, you agree to our Terms of Service
                    </p>
                </Card>

                <p className="text-center text-sm text-indigo-100 mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold hover:text-white transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function ClientInvitationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        }>
            <ClientInvitationContent />
        </Suspense>
    )
}
