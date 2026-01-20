// Client Portal - Deliverables Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { VendorDeliverable } from '@/types/portal';

export default function DeliverablesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [deliverables, setDeliverables] = useState<VendorDeliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliverables();
  }, [workspaceId]);

  async function loadDeliverables() {
    try {
      const { data, error } = await supabase
        .from('vendor_deliverables')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading deliverables:', error);
        return;
      }

      setDeliverables(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveDeliverable(deliverableId: string) {
    try {
      const { error } = await supabase
        .from('vendor_deliverables')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', deliverableId);

      if (error) {
        console.error('Error approving deliverable:', error);
        return;
      }

      loadDeliverables();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'revision_requested':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'approved':
        return 'default';
      case 'delivered':
        return 'secondary';
      case 'revision_requested':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  }

  if (loading) {
    return <div>Loading deliverables...</div>;
  }

  const deliveredItems = deliverables.filter((d) => d.status !== 'draft');
  const draftItems = deliverables.filter((d) => d.status === 'draft');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deliverables</h1>
        <p className="mt-2 text-muted-foreground">
          Files and links provided by your vendor
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliverables.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliverables.filter((d) => d.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliverables.filter((d) => d.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivered Items */}
      {deliveredItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Delivered Items</h2>
          {deliveredItems.map((deliverable) => (
            <Card key={deliverable.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deliverable.status)}
                      <CardTitle>{deliverable.name}</CardTitle>
                    </div>
                    {deliverable.description && (
                      <CardDescription className="mt-2">
                        {deliverable.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(deliverable.status)}>
                    {deliverable.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* File/Link Info */}
                <div className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    {deliverable.deliverable_type === 'link' ? (
                      <ExternalLink className="h-6 w-6 text-blue-600" />
                    ) : (
                      <FileText className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {deliverable.deliverable_type === 'link' ? 'External Link' : 'File'}
                    </p>
                    {deliverable.file_type && (
                      <p className="text-sm text-muted-foreground">
                        {deliverable.file_type.toUpperCase()}
                        {deliverable.file_size && ` • ${formatFileSize(deliverable.file_size)}`}
                      </p>
                    )}
                  </div>
                  {deliverable.file_url && (
                    <Button asChild>
                      <a href={deliverable.file_url} target="_blank" rel="noopener noreferrer">
                        {deliverable.deliverable_type === 'link' ? (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Link
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </>
                        )}
                      </a>
                    </Button>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {deliverable.delivered_at && (
                    <div>
                      <span className="font-medium">Delivered:</span>{' '}
                      {new Date(deliverable.delivered_at).toLocaleDateString()}
                    </div>
                  )}
                  {deliverable.approved_at && (
                    <div>
                      <span className="font-medium">Approved:</span>{' '}
                      {new Date(deliverable.approved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {deliverable.status === 'delivered' && (
                  <div className="flex gap-2 border-t pt-4">
                    <Button
                      onClick={() => approveDeliverable(deliverable.id)}
                      variant="default"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`/client-portal/${workspaceId}/revisions?deliverable=${deliverable.id}`}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Request Revision
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Draft Items (if visible to client) */}
      {draftItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">In Progress</h2>
          {draftItems.map((deliverable) => (
            <Card key={deliverable.id} className="opacity-60">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <CardTitle>{deliverable.name}</CardTitle>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {deliverables.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No deliverables yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your vendor will upload files and share links here as they complete work.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
