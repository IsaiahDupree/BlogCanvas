# BlogCanvas Scheduling System - Quick Start Guide

## For Vendors

### Step 1: Connect Google Calendar

1. Navigate to your vendor dashboard
2. Go to Settings → Calendar
3. Click "Connect Google Calendar"
4. Authorize BlogCanvas to access your calendar
5. You'll be redirected back with confirmation

**API Endpoint:**
```
GET /api/auth/google
```

---

### Step 2: Set Your Availability

1. Navigate to Settings → Availability
2. For each day you're available:
   - Click "Add Time Slot"
   - Set start time (e.g., 9:00 AM)
   - Set end time (e.g., 5:00 PM)
   - Add multiple slots if you have breaks
3. Click "Save Changes"

**Example Schedule:**
```
Monday:    9:00 AM - 12:00 PM, 1:00 PM - 5:00 PM
Tuesday:   9:00 AM - 12:00 PM, 1:00 PM - 5:00 PM
Wednesday: 9:00 AM - 12:00 PM
Thursday:  9:00 AM - 12:00 PM, 1:00 PM - 5:00 PM
Friday:    9:00 AM - 12:00 PM
```

**API Endpoint:**
```
PUT /api/vendor/availability
Body: {
  "availability": [
    {
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "12:00"
    }
  ]
}
```

---

### Step 3: Create Meeting Types

1. Navigate to Settings → Meetings
2. Create meeting types:
   - Name: "30-Minute Consultation"
   - Duration: 30 minutes
   - Location: Google Meet
   - Price: $0 (or set a price)

**Database Table:** `vendor_meeting_types`

---

### Step 4: Share Your Booking Link

Your booking page:
```
https://blogcanvas.com/@yourhandle/book
```

Or embed the BookingCalendar component on your offer pages.

---

## For Clients

### Booking a Meeting

1. Visit vendor's booking page
2. View available time slots
3. Select a date and time
4. Enter your:
   - Name
   - Email (required)
   - Notes (optional)
5. Click "Confirm Booking"
6. Check your email for confirmation

**API Endpoint:**
```
POST /api/scheduling/book
Body: {
  "vendor_id": "uuid",
  "meeting_type_id": "uuid",
  "start_time": "2026-01-20T14:00:00Z",
  "end_time": "2026-01-20T14:30:00Z",
  "timezone": "America/New_York",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "notes": "Looking forward to discussing..."
}
```

---

## Component Usage

### BookingCalendar Component

```tsx
import BookingCalendar from '@/components/scheduling/BookingCalendar';

export default function BookingPage() {
  return (
    <BookingCalendar
      vendorId="vendor-uuid"
      meetingTypeId="meeting-type-uuid"
      onBookingComplete={(meetingId) => {
        console.log('Meeting booked:', meetingId);
        // Redirect or show success message
      }}
    />
  );
}
```

---

## API Reference

### Get Available Slots

```typescript
GET /api/scheduling/slots?vendor_id=xxx&meeting_type_id=xxx&start_date=xxx&end_date=xxx

Response: {
  success: true,
  slots: [
    {
      start: "2026-01-20T14:00:00Z",
      end: "2026-01-20T14:30:00Z"
    }
  ],
  meeting_type: {
    id: "uuid",
    name: "30-Minute Consultation",
    duration_minutes: 30
  }
}
```

### Book a Meeting

```typescript
POST /api/scheduling/book
Body: {
  vendor_id: string,
  meeting_type_id: string,
  start_time: string,
  end_time: string,
  timezone: string,
  client_name: string,
  client_email: string,
  notes?: string
}

Response: {
  success: true,
  meeting: {
    id: "uuid",
    title: "Meeting Title",
    start_time: "2026-01-20T14:00:00Z",
    end_time: "2026-01-20T14:30:00Z",
    meeting_link: "https://meet.google.com/xxx-xxxx-xxx",
    status: "scheduled"
  }
}
```

### Cancel a Meeting

```typescript
DELETE /api/scheduling/book?meeting_id=xxx

Response: {
  success: true,
  message: "Meeting cancelled successfully"
}
```

---

## Email Templates

### Meeting Confirmation Email

Automatically sent when a meeting is booked.

**Template:** `src/lib/email/templates/meeting-confirmation.tsx`

**Includes:**
- Meeting details (date, time, timezone)
- Google Meet link (if applicable)
- Location details
- Custom notes
- Vendor contact information

### Portal Ready Email

Sent when a workspace is created after checkout.

**Template:** `src/lib/email/templates/portal-ready.tsx`

**Includes:**
- Purchase summary
- Portal access link
- Next steps checklist
- Vendor contact information

---

## Database Schema

### vendor_calendar_integrations

```sql
CREATE TABLE vendor_calendar_integrations (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  provider TEXT, -- 'google', 'microsoft', 'apple'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  is_active BOOLEAN,
  last_sync_at TIMESTAMPTZ
);
```

### vendor_availability

```sql
CREATE TABLE vendor_availability (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  day_of_week INTEGER, -- 0 = Sunday, 6 = Saturday
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN
);
```

### vendor_meetings

```sql
CREATE TABLE vendor_meetings (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  client_id UUID REFERENCES vendor_clients(id),
  meeting_type_id UUID REFERENCES vendor_meeting_types(id),
  title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  timezone TEXT,
  meeting_link TEXT,
  google_calendar_event_id TEXT,
  status TEXT, -- 'scheduled', 'completed', 'cancelled'
  client_email TEXT,
  client_name TEXT,
  notes TEXT
);
```

---

## Troubleshooting

### OAuth Not Working

1. Check environment variables:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:4848/api/auth/google/callback
   ```

2. Verify redirect URI matches Google Console

3. Check OAuth scopes:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```

### No Available Slots Showing

1. Verify vendor has set availability
2. Check vendor's Google Calendar for conflicts
3. Ensure meeting type is active
4. Check date range (default is 7 days)

### Calendar Events Not Creating

1. Check calendar integration is active
2. Verify access token is not expired
3. Check refresh token exists
4. Review API error logs

### Emails Not Sending

1. Check Resend API key is set
2. Verify domain is configured
3. Check email template syntax
4. Review Resend dashboard for delivery status

---

## Environment Variables Required

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4848/api/auth/google/callback

# Email Service
RESEND_API_KEY=your-resend-api-key
RESEND_DOMAIN=blogcanvas.io

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:4848
```

---

## Testing Script

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to vendor dashboard
open http://localhost:4848/vendor/dashboard

# 3. Connect Google Calendar
open http://localhost:4848/vendor/settings/calendar

# 4. Set availability
open http://localhost:4848/vendor/settings/availability

# 5. Test booking (replace with actual vendor ID)
open http://localhost:4848/@yourhandle/book
```

---

## Performance Tips

1. **Cache Available Slots:**
   - Cache slots API response for 5 minutes
   - Invalidate on availability updates

2. **Optimize Calendar Queries:**
   - Batch free/busy requests
   - Limit date range to 14-30 days max

3. **Lazy Load Components:**
   - Code split BookingCalendar component
   - Load Google APIs only when needed

---

## Next Steps

Once scheduling is working:

1. Add automated reminder emails
2. Implement rescheduling flow
3. Add recurring meetings
4. Track no-show rates
5. Build meeting notes feature
6. Add recording upload support

---

**Last Updated:** January 17, 2026
**Version:** 1.0
