'use client';

import { useState, useEffect } from 'react';
import {
    Folder,
    File,
    Download,
    Trash2,
    Edit,
    Search,
    Grid,
    List,
    ChevronRight,
    ArrowLeft,
    MoreVertical,
    FolderPlus,
    Tag
} from 'lucide-react';
import FileUpload from './FileUpload';

interface FileBrowserProps {
    clientId?: string | null;
    initialFolderId?: string | null;
}

interface FileItem {
    id: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    title: string;
    description: string;
    tags: string[];
    folder_id: string | null;
    created_at: string;
    uploaded_by: string;
}

interface FolderItem {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    parent_folder_id: string | null;
    created_at: string;
}

export default function FileBrowser({ clientId = null, initialFolderId = null }: FileBrowserProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
    const [breadcrumb, setBreadcrumb] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Fetch files and folders
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch files
            const filesParams = new URLSearchParams();
            if (currentFolderId) filesParams.append('folder_id', currentFolderId);
            if (clientId) filesParams.append('client_id', clientId);
            if (searchQuery) filesParams.append('search', searchQuery);

            const filesRes = await fetch(`/api/files?${filesParams}`);
            const filesData = await filesRes.json();

            if (filesData.success) {
                setFiles(filesData.files);
            }

            // Fetch folders
            const foldersParams = new URLSearchParams();
            if (currentFolderId) {
                foldersParams.append('parent_id', currentFolderId);
            } else {
                foldersParams.append('parent_id', 'root');
            }
            if (clientId) foldersParams.append('client_id', clientId);

            const foldersRes = await fetch(`/api/folders?${foldersParams}`);
            const foldersData = await foldersRes.json();

            if (foldersData.success) {
                setFolders(foldersData.folders);
            }

            // Fetch breadcrumb if in a folder
            if (currentFolderId) {
                const breadcrumbRes = await fetch(`/api/folders/${currentFolderId}`);
                const breadcrumbData = await breadcrumbRes.json();
                if (breadcrumbData.success && breadcrumbData.path) {
                    setBreadcrumb(breadcrumbData.path);
                }
            } else {
                setBreadcrumb([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentFolderId, clientId, searchQuery]);

    const handleDownload = async (fileId: string) => {
        try {
            const res = await fetch(`/api/files/${fileId}/download`);
            const data = await res.json();

            if (data.success) {
                window.open(data.downloadUrl, '_blank');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const res = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchData(); // Refresh
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFolderName,
                    parent_folder_id: currentFolderId
                })
            });

            if (res.ok) {
                setNewFolderName('');
                setShowNewFolder(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Files</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNewFolder(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FolderPlus className="h-4 w-4" />
                            New Folder
                        </button>
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Upload Files
                        </button>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <button
                        onClick={() => setCurrentFolderId(null)}
                        className="hover:text-blue-600"
                    >
                        Home
                    </button>
                    {breadcrumb.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" />
                            <button
                                onClick={() => setCurrentFolderId(item.id)}
                                className={`hover:text-blue-600 ${index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : ''}`}
                            >
                                {item.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Search and View Toggle */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-600'}`}
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            {showUpload && (
                <div className="p-4 border-b border-gray-200">
                    <FileUpload
                        folderId={currentFolderId}
                        clientId={clientId}
                        onUploadComplete={() => {
                            fetchData();
                            setShowUpload(false);
                        }}
                    />
                </div>
            )}

            {/* New Folder Modal */}
            {showNewFolder && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            onClick={handleCreateFolder}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => {
                                setShowNewFolder(false);
                                setNewFolderName('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : (
                    <>
                        {/* Folders */}
                        {folders.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Folders</h3>
                                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setCurrentFolderId(folder.id)}
                                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                                        >
                                            <Folder className="h-8 w-8 flex-shrink-0" style={{ color: folder.color }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                                                {folder.description && (
                                                    <p className="text-xs text-gray-500 truncate">{folder.description}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files */}
                        {files.length > 0 ? (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Files</h3>
                                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                                    {files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="group border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start gap-3">
                                                <File className="h-8 w-8 text-blue-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate" title={file.original_filename}>
                                                        {file.title || file.original_filename}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                                                    </p>
                                                    {file.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {file.tags.map((tag, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                                                >
                                                                    <Tag className="h-3 w-3" />
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownload(file.id)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(file.id)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : folders.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <File className="h-12 w-12 mb-4 text-gray-300" />
                                <p>No files in this folder</p>
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="mt-4 text-blue-600 hover:underline"
                                >
                                    Upload your first file
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
