'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, AlertCircle, Shield, Briefcase, User, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Check if registration is allowed (set via env)
const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true'

export default function LoginPage() {
    const router = useRouter()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [userType, setUserType] = useState<'vendor' | 'client'>('vendor')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [requires2FA, setRequires2FA] = useState(false)
    const [twoFAToken, setTwoFAToken] = useState('')
    const [redirectUrl, setRedirectUrl] = useState('/app')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        console.log('[Login] Starting login process')
        console.log('[Login] Selected user type:', userType)
        console.log('[Login] Target redirect:', getRedirectUrl())

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, userType })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }

            if (data.requires2FA) {
                console.log('[Login] 2FA required, storing redirect URL:', getRedirectUrl())
                setRequires2FA(true)
                // Use selected userType for redirect after 2FA
                setRedirectUrl(getRedirectUrl())
                setLoading(false)
                return
            }

            // Always use selected userType for redirect
            const targetUrl = getRedirectUrl()
            console.log('[Login] Login successful')
            console.log('[Login] User type selected:', userType)
            console.log('[Login] API returned redirectUrl:', data.redirectUrl)
            console.log('[Login] Using target URL based on selection:', targetUrl)
            console.log('[Login] User email:', data.user?.email)
            console.log('[Login] User role from profile:', data.userRole || 'unknown')
            router.push(targetUrl)
            router.refresh()

        } catch (err: any) {
            setError(err.message || 'An error occurred')
            setLoading(false)
        }
    }

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: twoFAToken, purpose: 'login' })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Invalid verification code')
                setLoading(false)
                return
            }

            router.push(redirectUrl)
            router.refresh()

        } catch (err: any) {
            setError(err.message || 'Verification failed')
            setLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    fullName,
                    role: userType 
                })
            })

            const data = await response.json()

            if (!data.success) {
                // If user already exists, switch to login mode
                if (data.existingUser) {
                    setMode('login')
                    setError('Account exists. Please sign in with your password.')
                } else {
                    setError(data.error || 'Registration failed')
                }
                setLoading(false)
                return
            }

            if (data.requiresConfirmation) {
                setSuccess('Account created! Please check your email to confirm.')
            } else {
                setSuccess('Account created successfully!')
                setTimeout(() => {
                    router.push(getRedirectUrl())
                    router.refresh()
                }, 1500)
            }

        } catch (err: any) {
            setError(err.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')

        console.log('[Login] Starting Google OAuth sign-in')
        console.log('[Login] Selected user type for OAuth:', userType)

        try {
            // Pass userType in the redirect URL so callback knows where to redirect
            const callbackUrl = `${window.location.origin}/auth/callback?userType=${userType}`
            console.log('[Login] OAuth callback URL:', callbackUrl)
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: callbackUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) {
                setError(error.message)
                setLoading(false)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google')
            setLoading(false)
        }
    }

    // Redirect to appropriate dashboard based on user type
    const getRedirectUrl = () => userType === 'client' ? '/portal/dashboard' : '/app'

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">BlogCanvas</h1>
                    <p className="text-indigo-100">Choose your account type to sign in</p>
                </div>

                {/* User Type Selector */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={() => setUserType('vendor')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                            userType === 'vendor'
                                ? 'bg-white border-white shadow-lg'
                                : 'bg-white/10 border-white/30 hover:bg-white/20'
                        }`}
                    >
                        <Briefcase className={`w-8 h-8 mx-auto mb-2 ${userType === 'vendor' ? 'text-indigo-600' : 'text-white'}`} />
                        <div className={`font-semibold ${userType === 'vendor' ? 'text-gray-900' : 'text-white'}`}>
                            I'm a Vendor
                        </div>
                        <div className={`text-xs mt-1 ${userType === 'vendor' ? 'text-gray-500' : 'text-white/70'}`}>
                            Agency / Content Creator
                        </div>
                    </button>
                    <button
                        onClick={() => setUserType('client')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                            userType === 'client'
                                ? 'bg-white border-white shadow-lg'
                                : 'bg-white/10 border-white/30 hover:bg-white/20'
                        }`}
                    >
                        <User className={`w-8 h-8 mx-auto mb-2 ${userType === 'client' ? 'text-indigo-600' : 'text-white'}`} />
                        <div className={`font-semibold ${userType === 'client' ? 'text-gray-900' : 'text-white'}`}>
                            I'm a Client
                        </div>
                        <div className={`text-xs mt-1 ${userType === 'client' ? 'text-gray-500' : 'text-white/70'}`}>
                            Business / Website Owner
                        </div>
                    </button>
                </div>

                <Card className="p-8 bg-white shadow-2xl">
                    {requires2FA ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-indigo-600" />
                                <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
                            </div>
                            <p className="text-muted-foreground mb-6">Enter the 6-digit code from your authenticator app</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleVerify2FA} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        value={twoFAToken}
                                        onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center text-2xl font-mono tracking-widest"
                                        required
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || twoFAToken.length !== 6}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequires2FA(false)
                                        setTwoFAToken('')
                                        setError('')
                                    }}
                                    className="w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Back to Login
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            {/* Login/Register Toggle */}
                            {allowRegistration && (
                                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                            mode === 'login' 
                                                ? 'bg-white shadow text-gray-900' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                            mode === 'register' 
                                                ? 'bg-white shadow text-gray-900' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <UserPlus className="w-4 h-4 inline mr-1" />
                                        Create Account
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-2">
                                {userType === 'vendor' ? (
                                    <Briefcase className="w-6 h-6 text-indigo-600" />
                                ) : (
                                    <User className="w-6 h-6 text-indigo-600" />
                                )}
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {mode === 'register' 
                                        ? `Create ${userType === 'vendor' ? 'Vendor' : 'Client'} Account`
                                        : `${userType === 'vendor' ? 'Vendor' : 'Client'} Login`}
                                </h2>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                {mode === 'register'
                                    ? `Create a new ${userType} account to get started`
                                    : userType === 'vendor' 
                                        ? 'Sign in to manage clients and create content' 
                                        : 'Sign in to review and approve your content'}
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                                    <Shield className="w-5 h-5" />
                                    <span className="text-sm">{success}</span>
                                </div>
                            )}

                            <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
                                {mode === 'register' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}
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

                                {mode === 'login' && (
                                    <div className="flex items-center justify-between text-sm">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" className="w-4 h-4" />
                                            <span className="text-gray-600">Remember me</span>
                                        </label>
                                        <Link href="/auth/reset-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !!success}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                                >
                                    {loading 
                                        ? (mode === 'register' ? 'Creating Account...' : 'Signing in...') 
                                        : (mode === 'register' ? 'Create Account' : 'Sign In')}
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
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="mt-4 w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>

                            {/* Info text based on user type */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 text-center">
                                    {userType === 'vendor' ? (
                                        <>
                                            <span className="font-medium text-indigo-600">Vendors</span> create and manage content for their clients.
                                            <br />
                                            <span className="text-xs text-gray-500 mt-1 block">
                                                Need an account? Contact us to get started.
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-medium text-indigo-600">Clients</span> review and approve content from their vendor.
                                            <br />
                                            <span className="text-xs text-gray-500 mt-1 block">
                                                Your vendor will send you login credentials.
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </>
                    )}
                </Card>

                <p className="text-center text-sm text-indigo-100 mt-6">
                    <Link href="/" className="hover:underline">← Back to Home</Link>
                </p>
            </div>
        </div>
    )
}
