# Gmail Integration Setup Guide

## Overview

BlogCanvas includes Gmail integration to sync email threads, manage client communications, and send emails directly from the platform.

## Features Implemented

✅ Gmail OAuth2 connection flow
✅ Email thread synchronization
✅ Message viewing with threading
✅ Link emails to clients and projects
✅ Send emails via Gmail API
✅ Connection management UI

## Database Schema

The following tables were created (migration: `20260112000009_gmail_integration.sql`):

- `gmail_connections` - Stores OAuth tokens and connection info
- `email_threads` - Synced email threads with metadata
- `email_messages` - Individual messages in threads
- `email_attachments` - Email attachments (structure only)

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4848/api/gmail/callback  # For development
```

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: "BlogCanvas Gmail Integration"
   - Authorized redirect URIs:
     - Development: `http://localhost:4848/api/gmail/callback`
     - Production: `https://yourdomain.com/api/gmail/callback`
   - Click "Create"

5. Copy the Client ID and Client Secret to your `.env.local`

### 2. OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (or "Internal" if using Google Workspace)
3. Fill in application information:
   - App name: "BlogCanvas"
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (if in testing mode)

### 3. Publishing (Production)

For production, you'll need to submit your app for verification if you want more than 100 users. Otherwise, use "Testing" mode and manually add users.

## File Structure

```
src/
├── lib/
│   └── gmail-service.ts          # Gmail API service class
├── app/
│   ├── api/
│   │   └── gmail/
│   │       ├── connect/route.ts         # Initiate OAuth flow
│   │       ├── callback/route.ts        # OAuth callback handler
│   │       ├── sync/route.ts            # Sync emails from Gmail
│   │       ├── connection/route.ts      # Get/delete connection
│   │       ├── send/route.ts            # Send email via Gmail
│   │       └── threads/
│   │           ├── route.ts                    # List threads
│   │           └── [threadId]/
│   │               ├── messages/route.ts       # Get thread messages
│   │               └── link/route.ts           # Link to client/project
│   └── app/
│       ├── settings/
│       │   └── gmail/
│       │       └── page.tsx      # Gmail connection settings
│       └── inbox/
│           └── page.tsx          # Email inbox with thread view
```

## API Endpoints

### OAuth Flow

- `GET /api/gmail/connect` - Get OAuth authorization URL
- `GET /api/gmail/callback` - Handle OAuth callback and save tokens

### Email Management

- `GET /api/gmail/connection` - Get user's Gmail connection
- `DELETE /api/gmail/connection` - Disconnect Gmail
- `POST /api/gmail/sync` - Sync emails from Gmail
- `GET /api/gmail/threads` - List email threads
- `GET /api/gmail/threads/[threadId]/messages` - Get messages in thread
- `POST /api/gmail/threads/[threadId]/link` - Link thread to client/project
- `POST /api/gmail/send` - Send email via Gmail

## User Flow

### First-Time Setup

1. Navigate to `/app/settings/gmail`
2. Click "Connect Gmail"
3. Authorize with Google (OAuth consent screen)
4. Redirected back to settings with success message
5. Click "Sync Now" to import emails
6. Navigate to `/app/inbox` to view emails

### Daily Usage

1. View emails at `/app/inbox`
2. Click thread to view messages
3. Link emails to clients/projects
4. Auto-sync runs on schedule (or manual sync)

## Security Considerations

### Token Encryption

⚠️ **IMPORTANT**: In production, tokens should be encrypted before storing in the database.

Current implementation stores tokens in plaintext (marked with TODO comments). For production:

1. Use a strong encryption library (e.g., Node.js `crypto` with AES-256)
2. Store encryption key in environment variable
3. Encrypt `access_token` and `refresh_token` before saving
4. Decrypt when retrieving from database

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

- Users can only view/modify their own Gmail connections
- Email threads/messages are scoped to the connection owner
- No cross-user data access possible

## Testing

### Manual Testing Checklist

- [ ] Connect Gmail account successfully
- [ ] OAuth flow redirects correctly
- [ ] Tokens saved to database
- [ ] Sync imports emails from Gmail
- [ ] Thread list displays correctly
- [ ] Clicking thread loads messages
- [ ] Messages display with formatting
- [ ] Link to client/project works
- [ ] Disconnect removes connection

### Testing Without Real Gmail

For testing without OAuth setup, you can:

1. Manually insert test data into tables
2. Mock the Gmail API responses
3. Use the UI to verify components render

## Migration Instructions

### Apply Migration

The migration file is located at:
```
supabase/migrations/20260112000009_gmail_integration.sql
```

Apply to your Supabase project:

```bash
# If using Supabase CLI with linked project
npx supabase db push

# Or manually via Supabase Dashboard
# SQL Editor > New query > Paste migration > Run
```

## Troubleshooting

### "No Gmail connection found" Error

- Ensure you've completed the OAuth flow
- Check `gmail_connections` table for your user
- Verify tokens haven't expired

### OAuth Callback 404

- Check `GOOGLE_REDIRECT_URI` matches Google Console exactly
- Verify API route exists at `/api/gmail/callback`

### Sync Returns 0 Threads

- Check Google OAuth scopes are correct
- Verify token hasn't expired (refresh token should work)
- Check Gmail API quota limits

### TypeScript Errors

- Regenerate database types: `npx supabase gen types typescript`
- Install googleapis package: `npm install googleapis`

## Limits & Quotas

Gmail API has usage quotas:
- 1 billion quota units per day (default)
- Reading emails costs 5 units per request
- Sending emails costs 100 units per request

Monitor usage in [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Dashboard

## Future Enhancements

Potential improvements:

- [ ] Automated sync schedule (cron job)
- [ ] Email compose interface in app
- [ ] Rich text email editor
- [ ] Attachment download/upload
- [ ] Email search with filters
- [ ] Labels and categories
- [ ] Email templates for common responses
- [ ] Bulk operations (archive, delete, mark read)
- [ ] Push notifications for new emails (webhook)

## Support

For issues or questions:
- Check Supabase logs for API errors
- Verify Google Cloud Console for quota/auth issues
- Review browser console for frontend errors
