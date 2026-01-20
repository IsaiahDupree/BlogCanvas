'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Send,
  X,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Plus
} from 'lucide-react';

interface Deliverable {
  id: string;
  name: string;
  description?: string;
  deliverable_type: 'file' | 'link';
  file_url?: string;
  file_size?: number;
  file_type?: string;
  status: 'draft' | 'delivered' | 'approved' | 'revision_requested';
  delivered_at?: string;
  approved_at?: string;
  created_at: string;
}

interface Workspace {
  id: string;
  name: string;
  vendor_clients?: {
    email: string;
    full_name?: string;
  };
}

export default function VendorWorkspaceDeliverablesPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    link_url: '',
    deliver: false
  });

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      // Load workspace
      const wsResponse = await fetch(`/api/vendor/workspaces/${workspaceId}`);
      const wsData = await wsResponse.json();
      if (wsData.success) {
        setWorkspace(wsData.workspace);
      }

      // Load deliverables
      const response = await fetch(`/api/vendor/deliverables?workspace_id=${workspaceId}`);
      const data = await response.json();

      if (data.success) {
        setDeliverables(data.deliverables || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('workspace_id', workspaceId);
      uploadData.append('name', formData.name);
      uploadData.append('description', formData.description);
      uploadData.append('deliverable_type', uploadType);
      uploadData.append('deliver', formData.deliver ? 'true' : 'false');

      if (uploadType === 'file' && selectedFile) {
        uploadData.append('file', selectedFile);
      } else if (uploadType === 'link') {
        uploadData.append('link_url', formData.link_url);
      }

      const response = await fetch('/api/vendor/deliverables', {
        method: 'POST',
        body: uploadData
      });

      const data = await response.json();

      if (data.success) {
        setDeliverables([data.deliverable, ...deliverables]);
        setShowUploadModal(false);
        resetForm();
      } else {
        alert('Error uploading deliverable: ' + data.error);
      }

      setUploading(false);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading deliverable');
      setUploading(false);
    }
  };

  const deliverItem = async (deliverableId: string) => {
    try {
      const response = await fetch('/api/vendor/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deliverableId, status: 'delivered' })
      });

      const data = await response.json();

      if (data.success) {
        setDeliverables(deliverables.map(d =>
          d.id === deliverableId ? { ...d, status: 'delivered', delivered_at: new Date().toISOString() } : d
        ));
      }
    } catch (error) {
      console.error('Error delivering:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', link_url: '', deliver: false });
    setSelectedFile(null);
    setUploadType('file');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" /> Delivered</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'revision_requested':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" /> Revision Requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deliverables</h1>
          <p className="text-gray-600 mt-1">
            {workspace?.name} • {workspace?.vendor_clients?.full_name || workspace?.vendor_clients?.email}
          </p>
        </div>

        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deliverable
        </Button>
      </div>

      {/* Deliverables List */}
      {deliverables.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliverables Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Upload files or add links to share deliverables with your client.
          </p>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload First Deliverable
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliverables.map((deliverable) => (
            <Card key={deliverable.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gray-100">
                    {deliverable.deliverable_type === 'link' ? (
                      <LinkIcon className="h-6 w-6 text-gray-600" />
                    ) : (
                      <FileText className="h-6 w-6 text-gray-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{deliverable.name}</h3>
                      {getStatusBadge(deliverable.status)}
                    </div>
                    {deliverable.description && (
                      <p className="text-gray-600 text-sm mb-2">{deliverable.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {deliverable.file_type && (
                        <span>{deliverable.file_type.toUpperCase()}</span>
                      )}
                      {deliverable.file_size && (
                        <span>{formatFileSize(deliverable.file_size)}</span>
                      )}
                      <span>Added {new Date(deliverable.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deliverable.file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(deliverable.file_url, '_blank')}
                    >
                      {deliverable.deliverable_type === 'link' ? (
                        <><LinkIcon className="h-4 w-4 mr-1" /> Open</>
                      ) : (
                        <><Download className="h-4 w-4 mr-1" /> Download</>
                      )}
                    </Button>
                  )}
                  {deliverable.status === 'draft' && (
                    <Button size="sm" onClick={() => deliverItem(deliverable.id)}>
                      <Send className="h-4 w-4 mr-1" /> Deliver
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Deliverable</h2>
              <button
                onClick={() => { setShowUploadModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadType === 'file' ? 'default' : 'outline'}
                  onClick={() => setUploadType('file')}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={uploadType === 'link' ? 'default' : 'outline'}
                  onClick={() => setUploadType('link')}
                  className="flex-1"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Final Design Files"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's included in this deliverable?"
                  rows={2}
                />
              </div>

              {uploadType === 'file' ? (
                <div>
                  <Label>File</Label>
                  <div
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                      ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    `}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-600">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
                          <X className="h-4 w-4 text-blue-600" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to select a file</p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="link_url">URL *</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                    required={uploadType === 'link'}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.deliver}
                  onChange={(e) => setFormData({ ...formData, deliver: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Deliver immediately and notify client</span>
              </label>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowUploadModal(false); resetForm(); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !formData.name || (uploadType === 'file' && !selectedFile) || (uploadType === 'link' && !formData.link_url)}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : formData.deliver ? 'Upload & Deliver' : 'Save as Draft'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
