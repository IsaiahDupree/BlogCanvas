'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Video,
  User,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  client_name?: string;
  client_email: string;
  meeting_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_url?: string;
  notes?: string;
}

interface MeetingStats {
  upcoming: number;
  completed_this_week: number;
  cancelled_this_month: number;
  total_hours_this_month: number;
}

export default function VendorMeetingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats>({
    upcoming: 0,
    completed_this_week: 0,
    cancelled_this_month: 0,
    total_hours_this_month: 0
  });
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadMeetingsData();
  }, [view]);

  const loadMeetingsData = async () => {
    try {
      const response = await fetch(`/api/vendor/meetings?view=${view}`);
      const data = await response.json();

      if (data.success) {
        setMeetings(data.meetings || []);
        setStats(data.stats || stats);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading meetings:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">
            Manage your scheduled calls and meetings
          </p>
        </div>

        <Button onClick={() => router.push('/vendor/settings/availability')}>
          <Clock className="h-4 w-4 mr-2" />
          Set Availability
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.upcoming}
              </p>
              <p className="text-sm text-gray-500 mt-1">Scheduled</p>
            </div>
            <div className="rounded-lg p-3 bg-blue-50 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.completed_this_week}
              </p>
              <p className="text-sm text-green-600 mt-1">Completed</p>
            </div>
            <div className="rounded-lg p-3 bg-green-50 text-green-600">
              <Video className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hours This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total_hours_this_month.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">In meetings</p>
            </div>
            <div className="rounded-lg p-3 bg-purple-50 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.cancelled_this_month}
              </p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            <div className="rounded-lg p-3 bg-red-50 text-red-600">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setView('upcoming')}
        >
          Upcoming
        </Button>
        <Button
          variant={view === 'past' ? 'default' : 'outline'}
          onClick={() => setView('past')}
        >
          Past Meetings
        </Button>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {view === 'upcoming' ? 'No Upcoming Meetings' : 'No Past Meetings'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {view === 'upcoming'
                ? 'When clients book meetings with you, they will appear here.'
                : 'Your completed meetings will be shown here.'}
            </p>
            <Button onClick={() => router.push('/vendor/settings/availability')}>
              Set Your Availability
            </Button>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`
                    rounded-lg p-4 text-center min-w-[80px]
                    ${isToday(meeting.start_time) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                    <p className="text-xs font-medium uppercase">
                      {new Date(meeting.start_time).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-2xl font-bold">
                      {new Date(meeting.start_time).getDate()}
                    </p>
                    <p className="text-xs">
                      {new Date(meeting.start_time).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                      {isToday(meeting.start_time) && meeting.status === 'scheduled' && (
                        <Badge className="bg-blue-600 text-white">Today</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                        <span className="text-gray-400">({meeting.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {meeting.client_name || meeting.client_email}
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      {meeting.meeting_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {meeting.meeting_url && meeting.status === 'scheduled' && (
                    <Button
                      onClick={() => window.open(meeting.meeting_url, '_blank')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
