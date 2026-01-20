'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TimeSlot {
  start: string;
  end: string;
}

interface MeetingType {
  id: string;
  name: string;
  duration_minutes: number;
  description?: string;
}

interface BookingCalendarProps {
  vendorId: string;
  meetingTypeId: string;
  onBookingComplete?: (meetingId: string) => void;
}

export default function BookingCalendar({
  vendorId,
  meetingTypeId,
  onBookingComplete
}: BookingCalendarProps) {
  const [loading, setLoading] = useState(true);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadAvailableSlots();
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    setLoading(true);

    try {
      // Calculate start and end dates (current date + 7 days)
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const response = await fetch(
        `/api/scheduling/slots?vendor_id=${vendorId}&meeting_type_id=${meetingTypeId}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );
      const data = await response.json();

      if (data.success) {
        setAvailableSlots(data.slots || []);
        setMeetingType(data.meeting_type);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading slots:', error);
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !clientEmail) {
      alert('Please select a time slot and provide your email');
      return;
    }

    setBooking(true);

    try {
      const response = await fetch('/api/scheduling/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          meeting_type_id: meetingTypeId,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          client_name: clientName,
          client_email: clientEmail,
          notes
        })
      });

      const data = await response.json();

      if (data.success) {
        setBookingSuccess(true);
        if (onBookingComplete) {
          onBookingComplete(data.meeting.id);
        }
      } else {
        alert('Error booking meeting: ' + data.error);
      }

      setBooking(false);
    } catch (error) {
      console.error('Error booking meeting:', error);
      alert('Error booking meeting');
      setBooking(false);
    }
  };

  if (bookingSuccess) {
    return (
      <Card className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Booked!</h2>
        <p className="text-gray-600 mb-4">
          Your meeting has been confirmed. You'll receive a confirmation email shortly.
        </p>
      </Card>
    );
  }

  // Group slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {};
  availableSlots.forEach(slot => {
    const date = new Date(slot.start).toDateString();
    if (!slotsByDate[date]) {
      slotsByDate[date] = [];
    }
    slotsByDate[date].push(slot);
  });

  const dates = Object.keys(slotsByDate).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Meeting Type Info */}
      {meetingType && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{meetingType.name}</h2>
          {meetingType.description && (
            <p className="text-gray-600 mb-2">{meetingType.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{meetingType.duration_minutes} minutes</span>
          </div>
        </Card>
      )}

      {/* Slot Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Time</h3>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : dates.length === 0 ? (
          <p className="text-gray-500">No available time slots. Please check back later.</p>
        ) : (
          <div className="space-y-6">
            {dates.map(date => {
              const slots = slotsByDate[date];
              const dateObj = new Date(date);
              const dateLabel = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div key={date}>
                  <h4 className="font-semibold text-gray-700 mb-3">{dateLabel}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {slots.map((slot, index) => {
                      const startTime = new Date(slot.start);
                      const timeLabel = startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      });

                      const isSelected = selectedSlot?.start === slot.start;

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {timeLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Contact Information */}
      {selectedSlot && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you'd like to share before the meeting?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button
              onClick={handleBooking}
              disabled={booking || !clientEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
            >
              <Calendar className="h-5 w-5 mr-2" />
              {booking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
