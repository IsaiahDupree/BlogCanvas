'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
    folderId?: string | null;
    clientId?: string | null;
    onUploadComplete?: (file: any) => void;
    onUploadError?: (error: string) => void;
    maxSize?: number; // in bytes, default 100MB
    acceptedTypes?: string[]; // MIME types
    multiple?: boolean;
}

interface UploadingFile {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    id: string;
}

export default function FileUpload({
    folderId = null,
    clientId = null,
    onUploadComplete,
    onUploadError,
    maxSize = 100 * 1024 * 1024, // 100MB
    acceptedTypes = [],
    multiple = true
}: FileUploadProps) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
        if (file.size > maxSize) {
            return `File size exceeds ${formatFileSize(maxSize)}`;
        }

        if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
            return `File type ${file.type} is not accepted`;
        }

        return null;
    };

    const uploadFile = async (file: File) => {
        const fileId = Math.random().toString(36).substring(7);

        // Add file to uploading list
        const uploadingFile: UploadingFile = {
            file,
            progress: 0,
            status: 'uploading',
            id: fileId
        };

        setUploadingFiles(prev => [...prev, uploadingFile]);

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            setUploadingFiles(prev =>
                prev.map(f => f.id === fileId
                    ? { ...f, status: 'error', error: validationError, progress: 0 }
                    : f
                )
            );
            onUploadError?.(validationError);
            return;
        }

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            if (folderId) formData.append('folder_id', folderId);
            if (clientId) formData.append('client_id', clientId);

            // Upload with progress tracking
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setUploadingFiles(prev =>
                        prev.map(f => f.id === fileId ? { ...f, progress } : f)
                    );
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    setUploadingFiles(prev =>
                        prev.map(f => f.id === fileId
                            ? { ...f, status: 'success', progress: 100 }
                            : f
                        )
                    );
                    onUploadComplete?.(response.file);

                    // Remove from list after 3 seconds
                    setTimeout(() => {
                        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
                    }, 3000);
                } else {
                    const error = JSON.parse(xhr.responseText).error || 'Upload failed';
                    setUploadingFiles(prev =>
                        prev.map(f => f.id === fileId
                            ? { ...f, status: 'error', error, progress: 0 }
                            : f
                        )
                    );
                    onUploadError?.(error);
                }
            });

            xhr.addEventListener('error', () => {
                const error = 'Network error during upload';
                setUploadingFiles(prev =>
                    prev.map(f => f.id === fileId
                        ? { ...f, status: 'error', error, progress: 0 }
                        : f
                    )
                );
                onUploadError?.(error);
            });

            xhr.open('POST', '/api/files');
            xhr.send(formData);

        } catch (error: any) {
            const errorMessage = error.message || 'Failed to upload file';
            setUploadingFiles(prev =>
                prev.map(f => f.id === fileId
                    ? { ...f, status: 'error', error: errorMessage, progress: 0 }
                    : f
                )
            );
            onUploadError?.(errorMessage);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(uploadFile);
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        files.forEach(uploadFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const removeFile = (fileId: string) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
    };

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-colors duration-200
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                `}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: {formatFileSize(maxSize)}
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={acceptedTypes.join(',')}
                    onChange={handleFileSelect}
                />
            </div>

            {/* Uploading files list */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploading Files</h4>
                    {uploadingFiles.map((uploadingFile) => (
                        <div
                            key={uploadingFile.id}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                        >
                            <div className="flex-shrink-0">
                                {uploadingFile.status === 'uploading' && (
                                    <File className="h-5 w-5 text-blue-500" />
                                )}
                                {uploadingFile.status === 'success' && (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                                {uploadingFile.status === 'error' && (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {uploadingFile.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(uploadingFile.file.size)}
                                </p>

                                {uploadingFile.status === 'uploading' && (
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadingFile.progress}%` }}
                                        />
                                    </div>
                                )}

                                {uploadingFile.status === 'error' && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {uploadingFile.error}
                                    </p>
                                )}

                                {uploadingFile.status === 'success' && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Upload complete
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(uploadingFile.id);
                                }}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
