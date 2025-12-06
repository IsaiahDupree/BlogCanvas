'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function PortalLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [magicLinkSent, setMagicLinkSent] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }

            // Redirect based on user role
            router.push(data.redirectUrl || '/portal/dashboard')
            router.refresh()

        } catch (err: any) {
            setError(err.message || 'An error occurred')
            setLoading(false)
        }
    }

    const handleMagicLink = async () => {
        if (!email) {
            setError('Please enter your email address')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Failed to send magic link')
                setLoading(false)
                return
            }

            setMagicLinkSent(true)
            setLoading(false)

        } catch (err: any) {
            setError(err.message || 'An error occurred')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo / Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">BlogCanvas</h1>
                    <p className="text-indigo-100">Client Portal</p>
                </div>

                <Card className="p-8 bg-white shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                    <p className="text-muted-foreground mb-6">Sign in to review your content</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {magicLinkSent && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            <p className="text-sm font-medium">Magic link sent!</p>
                            <p className="text-sm mt-1">Check your email and click the link to sign in.</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        setError('')
                                        setMagicLinkSent(false)
                                    }}
                                    placeholder="you@company.com"
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
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="w-4 h-4" />
                                <span className="text-gray-600">Remember me</span>
                            </label>
                            <Link href="/portal/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleMagicLink}
                            disabled={loading || magicLinkSent}
                            className="mt-4 w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {magicLinkSent ? 'Magic Link Sent ✓' : 'Send Magic Link'}
                        </button>
                    </div>
                </Card>

                <p className="text-center text-sm text-indigo-100 mt-6">
                    Need help? Contact your account manager
                </p>
            </div>
        </div>
    )
}
