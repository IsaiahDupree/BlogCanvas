'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Trash2, Save } from 'lucide-react';

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export default function VendorAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await fetch('/api/vendor/availability');
      const data = await response.json();

      if (data.success) {
        setAvailability(data.availability);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading availability:', error);
      setLoading(false);
    }
  };

  const addSlot = (dayOfWeek: number) => {
    setAvailability([
      ...availability,
      {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00'
      }
    ]);
  };

  const removeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const saveAvailability = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/vendor/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability })
      });

      const data = await response.json();

      if (data.success) {
        alert('Availability saved successfully!');
      } else {
        alert('Error saving availability: ' + data.error);
      }

      setSaving(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error saving availability');
      setSaving(false);
    }
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

  // Group slots by day
  const slotsByDay: Record<number, AvailabilitySlot[]> = {};
  availability.forEach((slot, index) => {
    if (!slotsByDay[slot.day_of_week]) {
      slotsByDay[slot.day_of_week] = [];
    }
    slotsByDay[slot.day_of_week].push({ ...slot, id: String(index) });
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Availability Settings</h1>
          <p className="text-gray-600 mt-1">
            Set your weekly availability for client meetings
          </p>
        </div>
        <Button
          onClick={saveAvailability}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Availability Grid */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          const daySlots = slotsByDay[dayIndex] || [];

          return (
            <Card key={dayIndex} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{dayName}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSlot(dayIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-gray-500 text-sm">No availability set for this day</p>
              ) : (
                <div className="space-y-3">
                  {daySlots.map((slot, slotIndex) => {
                    const globalIndex = availability.findIndex(
                      s => s.day_of_week === dayIndex && s.start_time === slot.start_time && s.end_time === slot.end_time
                    );

                    return (
                      <div key={slotIndex} className="flex items-center gap-4">
                        <Clock className="h-5 w-5 text-gray-400" />

                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateSlot(globalIndex, 'start_time', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateSlot(globalIndex, 'end_time', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(globalIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Helper Text */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Tips for Setting Availability</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Add multiple time slots per day if you have breaks</li>
          <li>• Time slots will be used to generate available booking times for clients</li>
          <li>• Your Google Calendar will be checked for conflicts automatically</li>
          <li>• Don't forget to connect your Google Calendar in Calendar Settings</li>
        </ul>
      </Card>
    </div>
  );
}
