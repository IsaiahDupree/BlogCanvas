'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  actor_name?: string;
  actor_type?: string;
  subject_type?: string;
  created_at: string;
  is_read: boolean;
  metadata?: any;
}

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  workspaceId?: string;
}

const activityIcons: Record<string, string> = {
  task_created: '📋',
  task_updated: '✏️',
  task_completed: '✅',
  task_assigned: '👤',
  comment_added: '💬',
  file_uploaded: '📎',
  blog_post_created: '📝',
  blog_post_published: '🚀',
  client_added: '👥',
  workspace_created: '🏢',
  meeting_booked: '📅',
  order_received: '💰',
  message_sent: '✉️'
};

export default function ActivityFeed({
  limit = 20,
  showHeader = true,
  workspaceId
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [limit, workspaceId]);

  const fetchActivities = async () => {
    try {
      const supabase = createClient();

      let query = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      setActivities(data || []);
      setUnreadCount(data?.filter((a) => !a.is_read).length || 0);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (activityId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('activities')
        .update({ is_read: true })
        .eq('id', activityId);

      fetchActivities();
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = createClient();
      await supabase
        .from('activities')
        .update({ is_read: true })
        .eq('is_read', false);

      fetchActivities();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {showHeader && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Activity Feed</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                !activity.is_read ? 'bg-blue-50' : ''
              }`}
              onClick={() => !activity.is_read && markAsRead(activity.id)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {activityIcons[activity.type] || '📌'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {activity.actor_name && (
                          <span className="text-xs text-gray-500">
                            by {activity.actor_name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(activity.created_at)}
                        </span>
                        {activity.subject_type && (
                          <span className="text-xs text-gray-400 capitalize">
                            · {activity.subject_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {!activity.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
