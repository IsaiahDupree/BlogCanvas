'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Mail, Trash2, CheckCircle, XCircle, Clock, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TeamManagementPage() {
    const [loading, setLoading] = useState(true)
    const [teamMembers, setTeamMembers] = useState<any[]>([])
    const [invitations, setInvitations] = useState<any[]>([])
    const [showInviteDialog, setShowInviteDialog] = useState(false)
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'staff' })
    const [inviting, setInviting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [teamRes, inviteRes] = await Promise.all([
                fetch('/api/vendors/team'),
                fetch('/api/vendors/team/invite'),
            ])

            const teamData = await teamRes.json()
            const inviteData = await inviteRes.json()

            if (teamRes.ok) setTeamMembers(teamData.team_members || [])
            if (inviteRes.ok) setInvitations(inviteData.invitations || [])

        } catch (err: any) {
            console.error('Error fetching team data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async () => {
        try {
            setInviting(true)
            setError(null)

            const res = await fetch('/api/vendors/team/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send invitation')
            }

            setSuccess(`Invitation sent to ${inviteForm.email}!`)
            setShowInviteDialog(false)
            setInviteForm({ email: '', role: 'staff' })
            setTimeout(() => setSuccess(null), 3000)

            // Refresh data
            await fetchData()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setInviting(false)
        }
    }

    const handleCancelInvite = async (invitationId: string) => {
        if (!confirm('Are you sure you want to cancel this invitation?')) return

        try {
            const res = await fetch(`/api/vendors/team/invite/${invitationId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to cancel invitation')
            }

            setSuccess('Invitation cancelled successfully')
            setTimeout(() => setSuccess(null), 3000)
            await fetchData()

        } catch (err: any) {
            setError(err.message)
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-700'
            case 'staff': return 'bg-blue-100 text-blue-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 text-green-700'
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            case 'expired': return 'bg-red-100 text-red-700'
            case 'cancelled': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading team...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-gray-900 mb-2 inline-block">
                        <ArrowLeft className="w-4 h-4 inline mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Team Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your team members and invitations
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInviteDialog(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Invite Team Member
                        </button>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}

                {/* Team Members */}
                <Card className="p-6 bg-white shadow-xl mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Team Members ({teamMembers.length})</h2>
                    </div>

                    <div className="space-y-4">
                        {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {member.full_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{member.full_name || 'No name'}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <Badge className={getRoleBadgeColor(member.role)}>
                                    {member.role}
                                </Badge>
                            </div>
                        ))}

                        {teamMembers.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>No team members yet</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pending Invitations */}
                <Card className="p-6 bg-white shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Pending Invitations ({invitations.filter(i => i.status === 'pending').length})</h2>
                    </div>

                    <div className="space-y-4">
                        {invitations.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Mail className="w-10 h-10 text-gray-400" />
                                    <div>
                                        <p className="font-semibold">{invite.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Invited {new Date(invite.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={getRoleBadgeColor(invite.role)}>
                                        {invite.role}
                                    </Badge>
                                    <Badge className={getStatusBadgeColor(invite.status)}>
                                        {invite.status}
                                    </Badge>
                                    {invite.status === 'pending' && (
                                        <button
                                            onClick={() => handleCancelInvite(invite.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Cancel invitation"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {invitations.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>No pending invitations</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Invite Dialog */}
                {showInviteDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-2xl font-bold mb-4">Invite Team Member</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 font-medium text-sm">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="colleague@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium text-sm">Role</label>
                                    <select
                                        value={inviteForm.role}
                                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="staff">Staff (Can invite team members)</option>
                                        <option value="owner">Owner (Full admin access)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowInviteDialog(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={inviting || !inviteForm.email}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {inviting ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
