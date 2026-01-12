'use client';

import FileBrowser from '@/components/files/FileBrowser';

export default function FilesPage() {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-1 p-6">
                <FileBrowser />
            </div>
        </div>
    );
}
