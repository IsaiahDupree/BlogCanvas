// Client Portal Overview Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, FileText, MessageSquare } from 'lucide-react';
import type { VendorWorkspace } from '@/types/client';
import type { VendorOrder } from '@/types/order';
import type { OnboardingStep } from '@/types/portal';

export default function ClientPortalOverview() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<VendorWorkspace | null>(null);
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load workspace
        const { data: workspaceData } = await supabase
          .from('vendor_workspaces')
          .select(`
            *,
            client:vendor_clients(*),
            vendor:vendors(*),
            offer:offers(*)
          `)
          .eq('id', workspaceId)
          .single();

        if (workspaceData) {
          setWorkspace(workspaceData);
        }

        // Load order
        const { data: orderData } = await supabase
          .from('vendor_orders')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (orderData) {
          setOrder(orderData);
        }

        // Load onboarding steps
        const { data: stepsData } = await supabase
          .from('onboarding_steps')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('step_order', { ascending: true });

        if (stepsData) {
          setOnboardingSteps(stepsData);
        }

        // Count unread messages
        const { count } = await supabase
          .from('vendor_messages')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('is_read', false)
          .eq('sender_type', 'vendor');

        setUnreadMessages(count || 0);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  const completedSteps = onboardingSteps.filter((s) => s.is_completed).length;
  const totalSteps = onboardingSteps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="mt-2 text-muted-foreground">
          Here's an overview of your {workspace.name} workspace
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={workspace.status === 'active' ? 'default' : 'secondary'}>
              {workspace.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <p className="text-xs text-muted-foreground">
              {completedSteps} of {totalSteps} steps complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
            <p className="text-xs text-muted-foreground">From your vendor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Started</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(workspace.started_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Summary */}
      {order && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
            <CardDescription>Order #{order.order_number}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">
                  {order.currency} ${Number(order.total_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment_status}
                </Badge>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid On:</span>
                  <span>{new Date(order.paid_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={`/client-portal/${workspaceId}/onboarding`}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Onboarding Steps
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={`/client-portal/${workspaceId}/messages`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Send a Message
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={`/client-portal/${workspaceId}/deliverables`}>
              <FileText className="mr-2 h-4 w-4" />
              View Deliverables
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
