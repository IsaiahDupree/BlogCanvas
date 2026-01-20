/**
 * Google Calendar API integration
 * Handles calendar operations for vendor scheduling
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from './oauth';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: CalendarEvent,
  calendarId: string = 'primary'
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1, // Enable Google Meet
    requestBody: event
  });

  return response.data;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = 'primary'
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event
  });

  return response.data;
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId,
    eventId
  });
}

/**
 * Get busy time slots from calendar
 */
export async function getFreeBusy(
  accessToken: string,
  refreshToken: string,
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }]
    }
  });

  return response.data.calendars?.[calendarId]?.busy || [];
}

/**
 * List user's calendars
 */
export async function listCalendars(
  accessToken: string,
  refreshToken: string
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

/**
 * Get calendar details
 */
export async function getCalendar(
  accessToken: string,
  refreshToken: string,
  calendarId: string = 'primary'
) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.calendars.get({ calendarId });
  return response.data;
}
