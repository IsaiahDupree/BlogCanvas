'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PrivacySettingsPage() {
    const [exporting, setExporting] = useState(false)
    const [exported, setExported] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [deleting, setDeleting] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        setExported(false)

        try {
            const response = await fetch('/api/gdpr/export?format=json', {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to export data')
            }

            // Download the file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `user-data-${Date.now()}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setExported(true)
            setTimeout(() => setExported(false), 5000)
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export data. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
            alert('Please type "DELETE MY ACCOUNT" exactly to confirm.')
            return
        }

        if (!confirm('Are you absolutely sure? This action CANNOT be undone. All your data will be permanently deleted.')) {
            return
        }

        setDeleting(true)

        try {
            const response = await fetch('/api/gdpr/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    confirmation: deleteConfirmation,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account')
            }

            // Account deleted successfully
            alert('Your account has been permanently deleted. You will be redirected to the home page.')
            window.location.href = '/'
        } catch (error: any) {
            console.error('Delete account error:', error)
            alert(`Failed to delete account: ${error.message}`)
            setDeleting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/settings" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        <ArrowLeft className="w-4 h-4 inline mr-2" />
                        Back to Settings
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Privacy & Data
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your personal data and privacy settings (GDPR compliance)
                    </p>
                </div>

                {/* Data Export */}
                <Card className="p-6 bg-white shadow-xl mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Download className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Export Your Data</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Download a complete copy of all your data stored in BlogCanvas. This includes your profile,
                        clients, blog posts, comments, files, and all other data associated with your account.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-1">GDPR Compliance</h3>
                                <p className="text-sm text-muted-foreground">
                                    Under GDPR regulations, you have the right to access all personal data we store about you.
                                    The export includes data from all tables in JSON format.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleExport}
                            disabled={exporting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {exporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data (JSON)
                                </>
                            )}
                        </Button>

                        {exported && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Export complete!</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Data Retention */}
                <Card className="p-6 bg-white shadow-xl mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Data Retention Policy</h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                        Your data is retained as long as your account is active. We automatically delete:
                    </p>

                    <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>Audit logs older than 90 days (configurable)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>Temporary files after 30 days of inactivity</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>Deleted drafts after 7 days in trash</span>
                        </li>
                    </ul>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                            All data is encrypted at rest and in transit. We use industry-standard security practices
                            to protect your information.
                        </p>
                    </div>
                </Card>

                {/* Account Deletion */}
                <Card className="p-6 bg-white shadow-xl border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-600">Delete Account</h2>
                        <Badge variant="destructive" className="ml-auto">Danger Zone</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-2 text-red-900">What will be deleted:</h3>
                                <ul className="space-y-1 text-sm text-red-800">
                                    <li>• Your user account and profile</li>
                                    <li>• All clients and client data</li>
                                    <li>• All blog posts and content</li>
                                    <li>• All comments and reviews</li>
                                    <li>• All files and documents</li>
                                    <li>• All vendors and team members</li>
                                    <li>• All analytics and reports</li>
                                    <li>• All integrations (CMS, email, etc.)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {!showDeleteConfirm ? (
                        <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            I want to delete my account
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-red-900">
                                    Type "DELETE MY ACCOUNT" to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="DELETE MY ACCOUNT"
                                    className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    disabled={deleting}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || deleting}
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {deleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Permanently Delete Account
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => {
                                        setShowDeleteConfirm(false)
                                        setDeleteConfirmation('')
                                    }}
                                    variant="outline"
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
