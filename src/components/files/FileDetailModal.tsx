'use client';

import { useState } from 'react';
import { X, FileText, Info } from 'lucide-react';
import FileVersionHistory from './FileVersionHistory';
import FileShare from './FileShare';

interface FileDetailModalProps {
    fileId: string;
    filename: string;
    isOpen: boolean;
    onClose: () => void;
    onVersionRestored?: () => void;
}

type Tab = 'versions' | 'sharing' | 'info';

export default function FileDetailModal({
    fileId,
    filename,
    isOpen,
    onClose,
    onVersionRestored
}: FileDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('versions');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold">{filename}</h2>
                            <p className="text-sm text-gray-500">File Details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <div className="flex gap-1 px-6">
                        <button
                            onClick={() => setActiveTab('versions')}
                            className={`px-4 py-3 font-medium border-b-2 transition ${
                                activeTab === 'versions'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Version History
                        </button>
                        <button
                            onClick={() => setActiveTab('sharing')}
                            className={`px-4 py-3 font-medium border-b-2 transition ${
                                activeTab === 'sharing'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Sharing
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'versions' && (
                        <FileVersionHistory
                            fileId={fileId}
                            onVersionRestored={onVersionRestored}
                        />
                    )}
                    {activeTab === 'sharing' && (
                        <FileShare fileId={fileId} filename={filename} />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
