// Vendor Workspaces List
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Eye, MessageSquare, Calendar } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  status: 'onboarding' | 'active' | 'completed' | 'paused' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  client: {
    id: string;
    full_name: string;
    email: string;
  };
  offer: {
    name: string;
  };
  _counts: {
    unread_messages: number;
    upcoming_meetings: number;
  };
}

export default function VendorWorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    filterWorkspaces();
  }, [searchQuery, statusFilter, workspaces]);

  async function loadWorkspaces() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) return;

      const { data: workspacesData } = await supabase
        .from('vendor_workspaces')
        .select(`
          *,
          client:vendor_clients!inner (
            id,
            full_name,
            email
          ),
          offer:offers (
            name
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('started_at', { ascending: false });

      if (!workspacesData) return;

      // Load counts for each workspace
      const workspacesWithCounts = await Promise.all(
        workspacesData.map(async (workspace) => {
          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('vendor_messages')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .eq('sender_type', 'client')
            .eq('is_read', false);

          // Count upcoming meetings
          const { count: meetingsCount } = await supabase
            .from('vendor_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString());

          return {
            ...workspace,
            _counts: {
              unread_messages: unreadCount || 0,
              upcoming_meetings: meetingsCount || 0,
            },
          };
        })
      );

      setWorkspaces(workspacesWithCounts as any);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterWorkspaces() {
    let filtered = workspaces;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.client.full_name?.toLowerCase().includes(query) ||
          w.client.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((w) => w.status === statusFilter);
    }

    setFilteredWorkspaces(filtered);
  }

  function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'active':
        return 'default';
      case 'onboarding':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'paused':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  if (loading) {
    return <div>Loading workspaces...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your client workspaces and track project progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaces.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.filter((w) => w.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.filter((w) => w.status === 'onboarding').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.filter((w) => w.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workspaces, clients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces List */}
      {filteredWorkspaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {workspaces.length === 0 ? 'No workspaces yet' : 'No matching workspaces'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {workspaces.length === 0
                ? 'Workspaces will appear here when clients purchase your offers'
                : 'Try adjusting your search or filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <Badge variant={getStatusColor(workspace.status)}>
                        {workspace.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      Client: {workspace.client.full_name || workspace.client.email}
                    </CardDescription>
                    <CardDescription>Offer: {workspace.offer?.name}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metadata */}
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Started:</span>{' '}
                    {new Date(workspace.started_at).toLocaleDateString()}
                  </div>
                  {workspace.completed_at && (
                    <div>
                      <span className="font-medium">Completed:</span>{' '}
                      {new Date(workspace.completed_at).toLocaleDateString()}
                    </div>
                  )}
                  {workspace._counts.unread_messages > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {workspace._counts.unread_messages} unread
                    </Badge>
                  )}
                  {workspace._counts.upcoming_meetings > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {workspace._counts.upcoming_meetings} upcoming
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/vendor/workspaces/${workspace.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Workspace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/vendor/clients/${workspace.client.id}`)}
                  >
                    View Client Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
