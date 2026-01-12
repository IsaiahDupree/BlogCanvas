'use client';

import { useState, useEffect } from 'react';
import {
    Share2,
    Copy,
    Check,
    Link as LinkIcon,
    Calendar,
    Lock,
    Eye,
    Download as DownloadIcon,
    Edit,
    Trash2,
    ExternalLink
} from 'lucide-react';

interface FileShare {
    id: string;
    share_token: string;
    permission: 'view' | 'download' | 'edit';
    expires_at: string | null;
    is_password_protected: boolean;
    is_active: boolean;
    view_count: number;
    download_count: number;
    created_at: string;
    revoked_at: string | null;
    shared_by_user?: {
        full_name: string;
        email: string;
    };
}

interface FileShareProps {
    fileId: string;
    filename: string;
}

export default function FileShare({ fileId, filename }: FileShareProps) {
    const [shares, setShares] = useState<FileShare[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    // Form state
    const [permission, setPermission] = useState<'view' | 'download' | 'edit'>('download');
    const [expiresIn, setExpiresIn] = useState<string>('never');
    const [password, setPassword] = useState('');
    const [maxDownloads, setMaxDownloads] = useState<number | null>(null);

    useEffect(() => {
        fetchShares();
    }, [fileId]);

    const fetchShares = async () => {
        try {
            const res = await fetch(`/api/files/${fileId}/share`);
            const data = await res.json();

            if (data.success) {
                setShares(data.shares);
            }
        } catch (error) {
            console.error('Error fetching shares:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            // Calculate expires_at
            let expiresAt = null;
            if (expiresIn !== 'never') {
                const now = new Date();
                const hours = parseInt(expiresIn);
                expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
            }

            const res = await fetch(`/api/files/${fileId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    permission,
                    expires_at: expiresAt,
                    password: password || null,
                    max_downloads: maxDownloads
                })
            });

            const data = await res.json();

            if (data.success) {
                setShares([data.share, ...shares]);
                setShowCreateForm(false);
                // Reset form
                setPermission('download');
                setExpiresIn('never');
                setPassword('');
                setMaxDownloads(null);
                // Copy link to clipboard
                if (data.share.share_url) {
                    await navigator.clipboard.writeText(data.share.share_url);
                    setCopiedToken(data.share.share_token);
                    setTimeout(() => setCopiedToken(null), 3000);
                }
            } else {
                alert(data.error || 'Failed to create share link');
            }
        } catch (error) {
            console.error('Error creating share:', error);
            alert('Failed to create share link');
        } finally {
            setCreating(false);
        }
    };

    const handleCopyLink = async (shareToken: string) => {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/shared/${shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopiedToken(shareToken);
        setTimeout(() => setCopiedToken(null), 3000);
    };

    const handleRevokeShare = async (shareId: string) => {
        if (!confirm('Revoke this share link? It will no longer be accessible.')) {
            return;
        }

        try {
            const res = await fetch(`/api/files/${fileId}/share`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ share_id: shareId, revoked: true })
            });

            const data = await res.json();

            if (data.success) {
                await fetchShares();
            } else {
                alert(data.error || 'Failed to revoke share');
            }
        } catch (error) {
            console.error('Error revoking share:', error);
            alert('Failed to revoke share');
        }
    };

    const getPermissionIcon = (perm: string) => {
        switch (perm) {
            case 'view': return <Eye className="w-4 h-4" />;
            case 'download': return <DownloadIcon className="w-4 h-4" />;
            case 'edit': return <Edit className="w-4 h-4" />;
            default: return <Eye className="w-4 h-4" />;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share File
                </h3>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Create Share Link
                </button>
            </div>

            {showCreateForm && (
                <form onSubmit={handleCreateShare} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Permission Level</label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="view">View Only</option>
                            <option value="download">View & Download</option>
                            <option value="edit">View, Download & Edit</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Expires In</label>
                        <select
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="never">Never</option>
                            <option value="1">1 hour</option>
                            <option value="24">24 hours</option>
                            <option value="168">7 days</option>
                            <option value="720">30 days</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Password Protection (Optional)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave empty for no password"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Max Downloads (Optional)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={maxDownloads || ''}
                            onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Unlimited"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create Link'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {shares.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <LinkIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No share links created yet</p>
                    </div>
                ) : (
                    shares.map((share) => {
                        const baseUrl = window.location.origin;
                        const shareUrl = `${baseUrl}/shared/${share.share_token}`;
                        const isCopied = copiedToken === share.share_token;
                        const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
                        const isRevoked = !!share.revoked_at;
                        const isInactive = isExpired || isRevoked;

                        return (
                            <div
                                key={share.id}
                                className={`border rounded-lg p-4 ${
                                    isInactive ? 'bg-gray-100 opacity-60' : 'bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getPermissionIcon(share.permission)}
                                        <span className="font-medium capitalize">{share.permission}</span>
                                        {share.is_password_protected && (
                                            <Lock className="w-4 h-4 text-gray-500" />
                                        )}
                                        {isRevoked && (
                                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                                Revoked
                                            </span>
                                        )}
                                        {isExpired && (
                                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                    {!isInactive && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCopyLink(share.share_token)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Copy link"
                                            >
                                                {isCopied ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                            <a
                                                href={shareUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                                title="Open link"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleRevokeShare(share.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                title="Revoke access"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Created {formatDate(share.created_at)}
                                            {share.expires_at && (
                                                <> • Expires {formatDate(share.expires_at)}</>
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {share.view_count} views • {share.download_count} downloads
                                    </div>
                                </div>

                                {isCopied && (
                                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                        <Check className="w-4 h-4" />
                                        Link copied to clipboard!
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
