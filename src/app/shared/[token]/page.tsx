'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Download,
    Eye,
    Lock,
    AlertCircle,
    FileText,
    Calendar,
    User
} from 'lucide-react';

interface ShareData {
    id: string;
    permission: 'view' | 'download' | 'edit';
    expires_at: string | null;
    file: {
        id: string;
        filename: string;
        file_type: string;
        file_size: number;
        title: string;
        description: string;
    };
}

export default function SharedFilePage() {
    const params = useParams();
    const token = params.token as string;

    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchShareData();
        }
    }, [token]);

    const fetchShareData = async (pwd?: string) => {
        try {
            const url = new URL(`/api/shared/${token}`, window.location.origin);
            if (pwd) {
                url.searchParams.set('password', pwd);
            }

            const res = await fetch(url.toString());
            const data = await res.json();

            if (data.success) {
                setShareData(data.share);
                setError(null);
                setRequiresPassword(false);
            } else if (data.requires_password) {
                setRequiresPassword(true);
                setError(null);
            } else {
                setError(data.error || 'Failed to access shared file');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load shared file');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await fetchShareData(password);
    };

    const handleDownload = async () => {
        if (!shareData || shareData.permission === 'view') {
            return;
        }

        setDownloading(true);
        try {
            const res = await fetch(`/api/shared/${token}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password || null })
            });

            const data = await res.json();

            if (data.success && data.download_url) {
                // Open download URL in new tab
                window.open(data.download_url, '_blank');
            } else {
                alert(data.error || 'Failed to download file');
            }
        } catch (err) {
            console.error('Error downloading file:', err);
            alert('Failed to download file');
        } finally {
            setDownloading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading shared file...</p>
                </div>
            </div>
        );
    }

    if (requiresPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-6">
                        <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Password Required</h1>
                        <p className="text-gray-600">
                            This shared file is password protected
                        </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Enter Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Access File
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!shareData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-8 h-8" />
                            <h1 className="text-2xl font-bold">Shared File</h1>
                        </div>
                        <p className="text-blue-100">
                            Someone has shared a file with you
                        </p>
                    </div>

                    {/* File Details */}
                    <div className="p-6 space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-1">
                                {shareData.file.title || shareData.file.filename}
                            </h2>
                            {shareData.file.description && (
                                <p className="text-gray-600">{shareData.file.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>{shareData.file.file_type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium">
                                    {formatFileSize(shareData.file.file_size)}
                                </span>
                            </div>
                        </div>

                        {shareData.expires_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-yellow-50 rounded-lg">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    This link expires on {formatDate(shareData.expires_at)}
                                </span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2">
                                {shareData.permission === 'view' ? (
                                    <div className="flex-1 p-4 bg-gray-50 rounded-lg text-center">
                                        <Eye className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                            This file is view-only. Downloads are not permitted.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {downloading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>Preparing download...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                <span>Download File</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Permission Info */}
                        <div className="text-xs text-gray-500 text-center pt-4 border-t">
                            <p>
                                Permission Level: <span className="font-medium capitalize">{shareData.permission}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Powered by BlogCanvas File Sharing</p>
                </div>
            </div>
        </div>
    );
}
