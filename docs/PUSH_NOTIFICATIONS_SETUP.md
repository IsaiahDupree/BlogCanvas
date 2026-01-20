# Push Notifications Setup Guide

This guide explains how to set up push notifications for BlogCanvas (PWA-005).

## Prerequisites

- Node.js installed
- web-push package installed (`npm install web-push`)

## Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications.

### 1. Generate Keys

Run the following command to generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SDbQjfTbSrQj...

Private Key:
YUieF3FZJCUANg0dGfYCeMaT9q8rGOvPp4q...
=======================================
```

### 2. Add to Environment Variables

Add these keys to your `.env.local` file:

```env
# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
VAPID_SUBJECT=mailto:support@blogcanvas.com
```

**Important:**
- Keep the private key secret! Never commit it to version control.
- The public key is safe to expose to the client (hence `NEXT_PUBLIC_`).
- Update the `VAPID_SUBJECT` with your actual support email.

## Database Migration

Apply the push notifications migration:

```bash
# If using Supabase CLI
supabase db reset

# Or run the migration directly
psql -d your_database < supabase/migrations/20260119000002_push_notifications.sql
```

This creates three tables:
- `push_subscriptions` - Stores browser push subscription endpoints
- `notification_preferences` - User preferences for notification channels/events
- `notification_log` - Audit log of sent notifications

## Usage

### 1. Request Permission (Client-side)

Add the `PushNotificationPrompt` component to your app layout:

```tsx
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <PushNotificationPrompt />
    </>
  )
}
```

### 2. Send Notifications (Server-side)

Use the helper functions from `lib/notifications/push.ts`:

```typescript
import { notifyNewOrder } from '@/lib/notifications/push'

// Send notification for a new order
await notifyNewOrder(
  vendorId,
  'John Doe',
  'SEO Audit Package',
  orderId
)
```

Available helper functions:
- `notifyNewOrder()`
- `notifyNewMessage()`
- `notifyMeetingReminder()`
- `notifyDeliverableApproved()`
- `notifyDeliverableRevision()`
- `notifyWorkspaceCreated()`
- `notifyFormSubmitted()`

### 3. Notification Settings Page

Add the settings component to your vendor settings page:

```tsx
import { NotificationSettings } from '@/components/notifications/NotificationSettings'

export default function SettingsPage() {
  return (
    <div>
      <h1>Notification Settings</h1>
      <NotificationSettings />
    </div>
  )
}
```

## Service Worker

The service worker (`public/sw.js`) already includes push notification handlers:

- `push` event - Displays the notification
- `notificationclick` event - Handles clicks on notifications

## Testing Push Notifications

### 1. Test in Browser

1. Open your app in a browser
2. Accept the notification permission when prompted
3. Send a test notification from the server

### 2. Test Script

Create a test script to send notifications:

```typescript
// scripts/test-push.ts
import { notifyNewOrder } from '@/lib/notifications/push'

const vendorId = 'your-vendor-id'
await notifyNewOrder(vendorId, 'Test Client', 'Test Offer', 'test-order-id')
console.log('Notification sent!')
```

Run with:
```bash
npx tsx scripts/test-push.ts
```

## Browser Support

Push notifications are supported in:
- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Safari 16+ (iOS 16.4+)
- ✅ Edge 17+
- ❌ IE (not supported)

## Troubleshooting

### Notifications not appearing

1. **Check browser permissions**: Make sure notifications are allowed
2. **Check VAPID keys**: Ensure they're properly set in `.env.local`
3. **Check service worker**: Ensure SW is registered and active
4. **Check notification preferences**: User may have disabled specific events

### Subscription failing

1. **Invalid VAPID keys**: Regenerate keys if needed
2. **Service worker not ready**: Wait for `navigator.serviceWorker.ready`
3. **HTTPS required**: Push notifications only work over HTTPS (or localhost)

### Testing on mobile

For iOS testing:
- Requires iOS 16.4+
- Must add app to home screen first
- Push notifications only work in standalone mode

## Security Notes

1. **Never expose private VAPID key**: Only public key should be client-accessible
2. **Validate user permissions**: Always check `isNotificationEnabled()` before sending
3. **Clean up old subscriptions**: Function `cleanup_old_push_subscriptions()` removes subscriptions older than 90 days
4. **Handle errors gracefully**: Subscriptions can become invalid (410 Gone)

## Production Checklist

- [ ] VAPID keys generated and added to production environment
- [ ] Database migration applied
- [ ] Service worker deployed and accessible
- [ ] HTTPS enabled on production domain
- [ ] Test notifications on various browsers
- [ ] Monitor notification logs for errors
- [ ] Set up error tracking (Sentry) for push failures

## API Endpoints

- `GET /api/push/vapid-key` - Get public VAPID key
- `POST /api/push/subscribe` - Subscribe to push notifications
- `DELETE /api/push/unsubscribe` - Unsubscribe from push
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

## Event Types

Supported notification events:
- `order.created` - New order placed
- `message.received` - New message
- `meeting.reminder` - Meeting reminder (15 min before)
- `deliverable.approved` - Deliverable approved by client
- `deliverable.revision` - Revision requested
- `workspace.created` - New workspace created
- `form.submitted` - Form submitted by client

## Resources

- [Web Push Specification](https://www.w3.org/TR/push-api/)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push library](https://github.com/web-push-libs/web-push)
