'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/portal/login')
                }, 2000)
            } else {
                setError(data.error || 'Failed to reset password')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
                    <p className="text-gray-600 mb-4">
                        This password reset link is invalid or has expired.
                    </p>
                    <Button onClick={() => router.push('/portal/login')}>
                        Back to Login
                    </Button>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-4 text-green-600">Password Reset Successful</h1>
                    <p className="text-gray-600 mb-4">
                        Your password has been updated. Redirecting to login...
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
                <p className="text-gray-600 mb-6">
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-4">Loading...</h1>
                </Card>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}

