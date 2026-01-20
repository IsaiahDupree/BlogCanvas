// Client Portal - Meetings Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Video, Phone, MapPin, Clock, CheckCircle, X } from 'lucide-react';
import type { VendorMeeting } from '@/types/scheduling';

export default function MeetingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [meetings, setMeetings] = useState<VendorMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [workspaceId]);

  async function loadMeetings() {
    try {
      const { data, error } = await supabase
        .from('vendor_meetings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading meetings:', error);
        return;
      }

      setMeetings(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function getLocationIcon(locationType: string) {
    switch (locationType) {
      case 'google_meet':
      case 'zoom':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'completed':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  function formatMeetingTime(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const startTimeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      date: dateStr,
      time: `${startTimeStr} - ${endTimeStr}`,
    };
  }

  function getDuration(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return minutes;
  }

  if (loading) {
    return <div>Loading meetings...</div>;
  }

  const now = new Date();
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'scheduled' && new Date(m.start_time) > now
  );
  const pastMeetings = meetings.filter(
    (m) => m.status === 'completed' || new Date(m.start_time) <= now
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="mt-2 text-muted-foreground">
            Schedule and manage meetings with your vendor
          </p>
        </div>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Book a Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings.filter((m) => m.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
          {upcomingMeetings.map((meeting) => {
            const { date, time } = formatMeetingTime(meeting.start_time, meeting.end_time);
            const duration = getDuration(meeting.start_time, meeting.end_time);

            return (
              <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(meeting.location_type)}
                        <CardTitle>{meeting.title}</CardTitle>
                      </div>
                      {meeting.description && (
                        <CardDescription className="mt-2">
                          {meeting.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Date & Time */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{time}</span>
                      <span className="text-muted-foreground">({duration} minutes)</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {getLocationIcon(meeting.location_type)}
                      <span className="capitalize">
                        {meeting.location_type.replace('_', ' ')}
                      </span>
                    </div>
                    {meeting.location_details && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {meeting.location_details}
                      </p>
                    )}
                  </div>

                  {/* Join Button */}
                  {meeting.meeting_link && (
                    <Button asChild className="w-full">
                      <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-2 h-4 w-4" />
                        Join Meeting
                      </a>
                    </Button>
                  )}

                  {/* Notes */}
                  {meeting.notes && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm font-medium">Notes:</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {meeting.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Meetings</h2>
          {pastMeetings.map((meeting) => {
            const { date, time } = formatMeetingTime(meeting.start_time, meeting.end_time);
            const duration = getDuration(meeting.start_time, meeting.end_time);

            return (
              <Card key={meeting.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(meeting.location_type)}
                        <CardTitle>{meeting.title}</CardTitle>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(meeting.status)}>
                      {meeting.status === 'cancelled' ? (
                        <>
                          <X className="mr-1 h-3 w-3" />
                          Cancelled
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{time}</span>
                      <span>({duration} minutes)</span>
                    </div>
                  </div>

                  {meeting.cancellation_reason && (
                    <div className="mt-4 rounded-lg border-l-4 border-l-red-500 bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-900">Cancellation Reason:</p>
                      <p className="mt-1 text-sm text-red-800">
                        {meeting.cancellation_reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {meetings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No meetings scheduled</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Book a meeting with your vendor to discuss your project.
            </p>
            <Button className="mt-4">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Book Your First Meeting
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
