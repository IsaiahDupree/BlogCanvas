'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    User, 
    Mail, 
    Lock, 
    LogOut,
    Loader2, 
    CheckCircle,
    AlertCircle,
    Camera,
    CreditCard,
    Calendar,
    FileText,
    Save
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface Profile {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    clients?: {
        id: string
        name: string
        status: string
        plan_type?: string
        plan_posts_per_month?: number
        plan_renewal_date?: string
    }
}

export default function ClientSettingsPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    
    // Password change
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/portal/profile')
            const data = await res.json()
            if (data.success && data.profile) {
                setProfile(data.profile)
                setFullName(data.profile.full_name || '')
                setEmail(data.profile.email || '')
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
            setError('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch('/api/portal/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName })
            })

            const data = await res.json()
            if (data.success) {
                setSuccess('Profile updated successfully')
                setProfile(prev => prev ? { ...prev, full_name: fullName } : null)
            } else {
                setError(data.error || 'Failed to update profile')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setChangingPassword(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    currentPassword, 
                    newPassword 
                })
            })

            const data = await res.json()
            if (data.success) {
                setSuccess('Password changed successfully')
                setShowPasswordDialog(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                setError(data.error || 'Failed to change password')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to change password')
        } finally {
            setChangingPassword(false)
        }
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/portal/login')
        } catch (err) {
            console.error('Logout error:', err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    const clientPlan = profile?.clients

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link href="/portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-slate-600">Manage your profile and preferences</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Success/Error Messages */}
                {success && (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <p className="text-emerald-700">{success}</p>
                        </CardContent>
                    </Card>
                )}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-red-700">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Profile Photo */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-indigo-600" />
                            Profile Photo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {profile?.avatar_url ? (
                                    <img 
                                        src={profile.avatar_url} 
                                        alt="Profile" 
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    fullName?.charAt(0)?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div>
                                <Button variant="outline" disabled>
                                    <Camera className="w-4 h-4 mr-2" />
                                    Change Photo
                                </Button>
                                <p className="text-xs text-slate-500 mt-2">JPG, PNG. Max 2MB.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="mt-1 bg-slate-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">Contact support to change your email</p>
                        </div>
                        <Button 
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Password */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-600" />
                            Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                    <DialogDescription>
                                        Enter your current password and choose a new one
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input
                                            id="current"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new">New Password</Label>
                                        <Input
                                            id="new"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="confirm">Confirm New Password</Label>
                                        <Input
                                            id="confirm"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleChangePassword}
                                        disabled={changingPassword}
                                        className="w-full bg-indigo-600"
                                    >
                                        {changingPassword ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : null}
                                        Change Password
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Plan Information */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Plan Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-slate-600">Current Plan</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {clientPlan?.plan_type || 'Professional'}
                                    </p>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1">
                                    Active
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm">Posts/Month</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {clientPlan?.plan_posts_per_month || 10}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">Renewal Date</span>
                                    </div>
                                    <p className="text-lg font-semibold text-slate-800">
                                        {clientPlan?.plan_renewal_date 
                                            ? new Date(clientPlan.plan_renewal_date).toLocaleDateString()
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logout */}
                <Card className="border-0 shadow-lg border-red-100">
                    <CardContent className="p-6">
                        <Button 
                            variant="outline" 
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
