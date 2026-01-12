'use client';

import { useState, useEffect } from 'react';
import {
    Clock,
    Download,
    RotateCcw,
    User,
    FileText,
    ChevronDown,
    ChevronUp,
    Upload
} from 'lucide-react';

interface FileVersion {
    id: string;
    version_number: number;
    filename: string;
    file_size: number;
    change_summary: string;
    is_current: boolean;
    uploaded_at: string;
    uploaded_by: string;
    uploader?: {
        full_name: string;
        email: string;
    };
}

interface FileVersionHistoryProps {
    fileId: string;
    onVersionRestored?: () => void;
}

export default function FileVersionHistory({ fileId, onVersionRestored }: FileVersionHistoryProps) {
    const [versions, setVersions] = useState<FileVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        fetchVersions();
    }, [fileId]);

    const fetchVersions = async () => {
        try {
            const res = await fetch(`/api/files/${fileId}/versions`);
            const data = await res.json();

            if (data.success) {
                setVersions(data.versions);
            }
        } catch (error) {
            console.error('Error fetching versions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = (versionId: string) => {
        const newExpanded = new Set(expandedVersions);
        if (newExpanded.has(versionId)) {
            newExpanded.delete(versionId);
        } else {
            newExpanded.add(versionId);
        }
        setExpandedVersions(newExpanded);
    };

    const handleRestore = async (versionId: string, versionNumber: number) => {
        if (!confirm(`Restore version ${versionNumber}? This will create a new version based on this one.`)) {
            return;
        }

        setRestoring(versionId);
        try {
            const res = await fetch(`/api/files/${fileId}/versions/${versionId}/restore`, {
                method: 'POST'
            });
            const data = await res.json();

            if (data.success) {
                await fetchVersions();
                onVersionRestored?.();
                alert(`Version ${versionNumber} restored successfully!`);
            } else {
                alert(data.error || 'Failed to restore version');
            }
        } catch (error) {
            console.error('Error restoring version:', error);
            alert('Failed to restore version');
        } finally {
            setRestoring(null);
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
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (versions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No version history available</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Version History
                </h3>
                <span className="text-sm text-gray-500">
                    {versions.length} version{versions.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-2">
                {versions.map((version) => {
                    const isExpanded = expandedVersions.has(version.id);
                    const isRestoring = restoring === version.id;

                    return (
                        <div
                            key={version.id}
                            className={`border rounded-lg p-4 ${
                                version.is_current ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">
                                            Version {version.version_number}
                                        </span>
                                        {version.is_current && (
                                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>
                                                {version.uploader?.full_name || version.uploader?.email || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatDate(version.uploaded_at)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatFileSize(version.file_size)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!version.is_current && (
                                        <button
                                            onClick={() => handleRestore(version.id, version.version_number)}
                                            disabled={isRestoring}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                                            title="Restore this version"
                                        >
                                            {isRestoring ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            ) : (
                                                <RotateCcw className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleExpanded(version.id)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {isExpanded && version.change_summary && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-700">
                                        <strong>Changes:</strong> {version.change_summary}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="flex items-start gap-2">
                    <Upload className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        Tip: Upload a new version to track changes over time. You can restore any previous version at any time.
                    </span>
                </p>
            </div>
        </div>
    );
}
