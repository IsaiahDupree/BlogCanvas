'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function PortalLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Simulate login
        setTimeout(() => {
            window.location.href = '/portal/dashboard'
        }, 1000)
    }

    const handleMagicLink = () => {
        alert('Magic link sent to ' + email)
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

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
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
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
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
                            onClick={handleMagicLink}
                            className="mt-4 w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Send Magic Link
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
