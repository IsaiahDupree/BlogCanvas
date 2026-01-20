// Client Portal - Revisions Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, GitPullRequest, X } from 'lucide-react';
import type { VendorRevision } from '@/types/portal';
import type { VendorDeliverable } from '@/types/portal';

export default function RevisionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const deliverableIdParam = searchParams.get('deliverable');

  const [revisions, setRevisions] = useState<VendorRevision[]>([]);
  const [deliverables, setDeliverables] = useState<VendorDeliverable[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>(deliverableIdParam || '');
  const [revisionTitle, setRevisionTitle] = useState('');
  const [revisionDescription, setRevisionDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRevisions();
    loadDeliverables();
  }, [workspaceId]);

  async function loadRevisions() {
    try {
      const { data, error } = await supabase
        .from('vendor_revisions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading revisions:', error);
        return;
      }

      setRevisions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDeliverables() {
    try {
      const { data, error } = await supabase
        .from('vendor_deliverables')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['delivered', 'approved'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading deliverables:', error);
        return;
      }

      setDeliverables(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function submitRevisionRequest() {
    if (!revisionTitle.trim() || !revisionDescription.trim() || submitting) return;

    setSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user found');
        return;
      }

      // Get vendor_id from workspace
      const { data: workspace } = await supabase
        .from('vendor_workspaces')
        .select('vendor_id')
        .eq('id', workspaceId)
        .single();

      if (!workspace) {
        console.error('Workspace not found');
        return;
      }

      const { error } = await supabase.from('vendor_revisions').insert({
        workspace_id: workspaceId,
        vendor_id: workspace.vendor_id,
        deliverable_id: selectedDeliverable || null,
        title: revisionTitle.trim(),
        description: revisionDescription.trim(),
        requested_by: user.id,
        status: 'pending',
      });

      if (error) {
        console.error('Error creating revision:', error);
        return;
      }

      // Reset form
      setRevisionTitle('');
      setRevisionDescription('');
      setSelectedDeliverable('');
      setShowRequestForm(false);

      // Update deliverable status if linked
      if (selectedDeliverable) {
        await supabase
          .from('vendor_deliverables')
          .update({ status: 'revision_requested' })
          .eq('id', selectedDeliverable);
      }

      loadRevisions();
      loadDeliverables();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <GitPullRequest className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  if (loading) {
    return <div>Loading revisions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revision Requests</h1>
          <p className="mt-2 text-muted-foreground">
            Request changes or improvements to deliverables
          </p>
        </div>
        <Button onClick={() => setShowRequestForm(!showRequestForm)}>
          <AlertCircle className="mr-2 h-4 w-4" />
          Request Revision
        </Button>
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Revision Request</CardTitle>
            <CardDescription>
              Describe what you'd like changed or improved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliverable">Related Deliverable (Optional)</Label>
              <Select value={selectedDeliverable} onValueChange={setSelectedDeliverable}>
                <SelectTrigger id="deliverable">
                  <SelectValue placeholder="Select a deliverable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General revision request</SelectItem>
                  {deliverables.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of the revision"
                value={revisionTitle}
                onChange={(e) => setRevisionTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about what needs to be changed..."
                value={revisionDescription}
                onChange={(e) => setRevisionDescription(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={submitRevisionRequest}
                disabled={!revisionTitle.trim() || !revisionDescription.trim() || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revisions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revisions.filter((r) => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revisions.filter((r) => r.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revisions.filter((r) => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revisions List */}
      <div className="space-y-4">
        {revisions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitPullRequest className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No revision requests yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                If you need changes to any deliverables, you can request revisions here.
              </p>
              <Button className="mt-4" onClick={() => setShowRequestForm(true)}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Request Your First Revision
              </Button>
            </CardContent>
          </Card>
        ) : (
          revisions.map((revision) => {
            const relatedDeliverable = revision.deliverable_id
              ? deliverables.find((d) => d.id === revision.deliverable_id)
              : null;

            return (
              <Card key={revision.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(revision.status)}
                        <CardTitle>{revision.title}</CardTitle>
                      </div>
                      {relatedDeliverable && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Related to: {relatedDeliverable.name}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(revision.status)}>
                      {revision.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Description</h4>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {revision.description}
                    </p>
                  </div>

                  {revision.resolution_notes && (
                    <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                      <h4 className="mb-2 text-sm font-medium text-green-900">
                        Resolution Notes
                      </h4>
                      <p className="whitespace-pre-wrap text-sm text-green-800">
                        {revision.resolution_notes}
                      </p>
                      {revision.resolved_at && (
                        <p className="mt-2 text-xs text-green-700">
                          Resolved on {new Date(revision.resolved_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Requested:</span>{' '}
                      {new Date(revision.created_at).toLocaleDateString()}
                    </div>
                    {revision.status === 'completed' && revision.resolved_at && (
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {new Date(revision.resolved_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
