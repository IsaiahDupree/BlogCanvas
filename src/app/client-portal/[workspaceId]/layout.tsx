// Client Portal Layout
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { VendorWorkspace } from '@/types/client';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  FileText,
  GitPullRequest,
  Calendar,
  Settings
} from 'lucide-react';

export default function ClientPortalLayout({
  children,
}: {
  children: React.node;
}) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<VendorWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const { data, error } = await supabase
          .from('vendor_workspaces')
          .select(`
            *,
            client:vendor_clients(*),
            vendor:vendors(*)
          `)
          .eq('id', workspaceId)
          .single();

        if (error) {
          console.error('Error loading workspace:', error);
          router.push('/');
          return;
        }

        setWorkspace(data);
      } catch (error) {
        console.error('Error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  const navigation = [
    {
      name: 'Overview',
      href: `/client-portal/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      name: 'Onboarding',
      href: `/client-portal/${workspaceId}/onboarding`,
      icon: CheckSquare,
    },
    {
      name: 'Messages',
      href: `/client-portal/${workspaceId}/messages`,
      icon: MessageSquare,
    },
    {
      name: 'Deliverables',
      href: `/client-portal/${workspaceId}/deliverables`,
      icon: FileText,
    },
    {
      name: 'Revisions',
      href: `/client-portal/${workspaceId}/revisions`,
      icon: GitPullRequest,
    },
    {
      name: 'Meetings',
      href: `/client-portal/${workspaceId}/meetings`,
      icon: Calendar,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {(workspace as any).vendor?.business_name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Client Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                {(workspace as any).client?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {(workspace as any).client?.full_name || (workspace as any).client?.email}
                </p>
                <p className="truncate text-xs text-gray-500">{workspace.status}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
