/**
 * Scheduling availability computation
 * Computes available time slots based on vendor availability and Google Calendar
 */

import { getFreeBusy } from '../google/calendar';
import { getValidAccessToken } from '../db/vendor/calendar';
import { createClient } from '../supabase/server';

export interface TimeSlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
}

export interface AvailabilitySlot {
  day_of_week: number;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
}

/**
 * Get vendor's availability rules
 */
export async function getVendorAvailability(vendorId: string): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendor_availability')
    .select('day_of_week, start_time, end_time')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[Scheduling] Error fetching vendor availability:', error);
    return [];
  }

  return data || [];
}

/**
 * Generate time slots based on availability rules
 */
export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  availabilityRules: AvailabilitySlot[],
  durationMinutes: number,
  bufferMinutes: number = 0,
  timezone: string = 'UTC'
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();

    // Find availability rules for this day
    const dayRules = availabilityRules.filter(rule => rule.day_of_week === dayOfWeek);

    for (const rule of dayRules) {
      // Parse start and end times
      const [startHour, startMin] = rule.start_time.split(':').map(Number);
      const [endHour, endMin] = rule.end_time.split(':').map(Number);

      // Create slot start time
      const slotStart = new Date(current);
      slotStart.setHours(startHour, startMin, 0, 0);

      // Create slot end time for the rule
      const ruleEnd = new Date(current);
      ruleEnd.setHours(endHour, endMin, 0, 0);

      // Generate slots within this availability window
      while (slotStart.getTime() + (durationMinutes + bufferMinutes) * 60000 <= ruleEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString()
        });

        // Move to next slot (add duration + buffer)
        slotStart.setTime(slotStart.getTime() + (durationMinutes + bufferMinutes) * 60000);
      }
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return slots;
}

/**
 * Filter out busy slots based on Google Calendar
 */
export async function filterBusySlots(
  vendorId: string,
  slots: TimeSlot[],
  calendarId: string = 'primary'
): Promise<TimeSlot[]> {
  if (slots.length === 0) {
    return [];
  }

  // Get valid access token
  const accessToken = await getValidAccessToken(vendorId);

  if (!accessToken) {
    console.warn('[Scheduling] No calendar access token, returning all slots');
    return slots;
  }

  try {
    // Get vendor's calendar integration for refresh token
    const supabase = await createClient();
    const { data: integration } = await supabase
      .from('vendor_calendar_integrations')
      .select('refresh_token')
      .eq('vendor_id', vendorId)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    if (!integration?.refresh_token) {
      console.warn('[Scheduling] No refresh token, returning all slots');
      return slots;
    }

    // Get busy times from Google Calendar
    const timeMin = slots[0].start;
    const timeMax = slots[slots.length - 1].end;

    const busyTimes = await getFreeBusy(
      accessToken,
      integration.refresh_token,
      timeMin,
      timeMax,
      calendarId
    );

    // Filter out slots that overlap with busy times
    const availableSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      // Check if slot overlaps with any busy time
      for (const busy of busyTimes) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        // Check for overlap
        if (slotStart < busyEnd && slotEnd > busyStart) {
          return false; // Slot overlaps with busy time
        }
      }

      return true; // Slot is available
    });

    return availableSlots;

  } catch (error) {
    console.error('[Scheduling] Error filtering busy slots:', error);
    // Return all slots if calendar check fails
    return slots;
  }
}

/**
 * Get available booking slots for a vendor
 */
export async function getAvailableSlots(
  vendorId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  bufferMinutes: number = 0,
  timezone: string = 'UTC'
): Promise<TimeSlot[]> {
  // Get vendor's availability rules
  const availabilityRules = await getVendorAvailability(vendorId);

  if (availabilityRules.length === 0) {
    return [];
  }

  // Generate all possible slots
  const allSlots = generateTimeSlots(
    startDate,
    endDate,
    availabilityRules,
    durationMinutes,
    bufferMinutes,
    timezone
  );

  // Filter out slots that are in the past
  const now = new Date();
  const futureSlots = allSlots.filter(slot => new Date(slot.start) > now);

  // Filter out busy slots from calendar
  const availableSlots = await filterBusySlots(vendorId, futureSlots);

  return availableSlots;
}
