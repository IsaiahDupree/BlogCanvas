# API Keys System - Setup Guide

## Overview

The API Keys system allows vendors to create API keys for programmatic access to BlogCanvas. It includes:

- **API Key Generation**: Cryptographically secure keys with customizable scopes
- **Authentication Middleware**: Validates API keys on each request
- **Rate Limiting**: Per-minute, per-hour, and per-day limits
- **Usage Tracking**: Logs all API requests for analytics and auditing
- **Management UI**: Create, view, update, and revoke API keys

## Database Setup

### 1. Apply Migration

```bash
# Apply the API keys migration
npx supabase db push

# Or manually apply:
psql $DATABASE_URL < supabase/migrations/20260112000005_api_keys.sql
```

### 2. Verify Tables

The migration creates 3 tables:

- `api_keys` - Stores API key metadata and hashed keys
- `api_key_usage` - Logs all API requests
- `api_key_rate_limit_buckets` - Tracks rate limit counters

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('api_keys', 'api_key_usage', 'api_key_rate_limit_buckets');
```

## API Key Format

API keys follow this format:

```
bc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

- Prefix: `bc_live_` (8 characters)
- Random part: 32 hex characters
- Total length: 40 characters

The first 16 characters (`bc_live_12345678`) are stored as the `key_prefix` for quick lookup. The full key is hashed with bcrypt before storage.

## Authentication

### Using API Keys in Requests

Include the API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer bc_live_abc123..." \
     https://api.blogcanvas.com/api/posts
```

### In Code (API Routes)

Use the `withApiKey` middleware:

```typescript
import { withApiKey, logApiCall } from '@/lib/api-key-middleware';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate and check permissions
  const result = await withApiKey(request, ['posts:read']);
  if (result.error) {
    return result.error;
  }

  const { apiKey } = result.context;

  // Your API logic here
  const posts = await fetchPosts(apiKey.vendor_id);

  // Log the API call
  await logApiCall(apiKey.id, request, 200, startTime);

  return NextResponse.json({ posts });
}
```

## Available Scopes

| Scope | Description |
|-------|-------------|
| `posts:read` | Read blog posts |
| `posts:write` | Create and update blog posts |
| `posts:delete` | Delete blog posts |
| `batches:read` | Read content batches |
| `batches:write` | Create and update content batches |
| `batches:delete` | Delete content batches |
| `clients:read` | Read client information |
| `clients:write` | Create and update clients |
| `websites:read` | Read website information |
| `websites:write` | Create and update websites |
| `analytics:read` | Read analytics data |
| `reports:read` | Read reports |
| `reports:generate` | Generate new reports |
| `newsletters:read` | Read newsletters |
| `newsletters:write` | Create and send newsletters |
| `webhooks:receive` | Receive webhook events |

## Rate Limiting

Rate limits are enforced in three time windows:

- **Per Minute**: Default 60 requests
- **Per Hour**: Default 1,000 requests
- **Per Day**: Default 10,000 requests

When a limit is exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "exceeded_window": "minute",
  "reset_at": "2026-01-12T12:35:00Z"
}
```

HTTP Status: `429 Too Many Requests`

Headers:
- `X-RateLimit-Limit`: The current limit
- `X-RateLimit-Remaining`: Requests remaining (always 0 when exceeded)
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## User Interface

### Accessing the UI

Navigate to `/app/api-keys` to manage API keys.

### Creating an API Key

1. Click "Create API Key"
2. Enter a descriptive name
3. Select required scopes
4. (Optional) Set an expiration date
5. Click "Create API Key"
6. **IMPORTANT**: Copy the key immediately - it's only shown once!

### Managing Keys

- **View Details**: Click "Details" to see usage statistics
- **Deactivate**: Temporarily disable a key without deleting it
- **Delete**: Permanently revoke a key

## API Endpoints

### List API Keys
```
GET /api/api-keys
```

Returns all API keys for the authenticated vendor (hashed keys not included).

### Create API Key
```
POST /api/api-keys
Content-Type: application/json

{
  "name": "Production API Key",
  "scopes": ["posts:read", "posts:write"],
  "expiresAt": "2027-01-01T00:00:00Z",
  "rateLimits": {
    "perMinute": 120,
    "perHour": 2000,
    "perDay": 20000
  }
}
```

Returns the full API key (only shown once) and the key metadata.

### Get API Key
```
GET /api/api-keys/{id}
```

Returns details for a specific API key.

### Update API Key
```
PATCH /api/api-keys/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "scopes": ["posts:read"],
  "isActive": false,
  "expiresAt": null,
  "rateLimits": {
    "perMinute": 60
  }
}
```

Updates an API key's settings. All fields are optional.

### Delete API Key
```
DELETE /api/api-keys/{id}
```

Permanently revokes an API key.

### Get Usage Statistics
```
GET /api/api-keys/{id}/usage?startDate=2026-01-01&endDate=2026-01-31
```

Returns usage statistics for an API key within a date range.

## Monitoring & Analytics

### View Usage Statistics

In the UI, click "Details" on any API key and go to the "Usage" tab to see:

- Total requests
- Success rate
- Failed requests
- Average response time
- Top endpoints
- Requests by day

### Database Queries

**Get all active keys:**
```sql
SELECT * FROM api_keys WHERE is_active = true;
```

**Check rate limit status:**
```sql
SELECT * FROM get_api_key_rate_limits('api-key-id-here');
```

**Get recent API usage:**
```sql
SELECT
  endpoint,
  method,
  status_code,
  COUNT(*) as request_count
FROM api_key_usage
WHERE api_key_id = 'api-key-id-here'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY endpoint, method, status_code
ORDER BY request_count DESC;
```

**Top API keys by usage:**
```sql
SELECT
  ak.name,
  ak.key_prefix,
  COUNT(aku.id) as total_requests,
  COUNT(aku.id) FILTER (WHERE aku.status_code >= 400) as failed_requests
FROM api_keys ak
LEFT JOIN api_key_usage aku ON aku.api_key_id = ak.id
WHERE aku.created_at > NOW() - INTERVAL '30 days'
GROUP BY ak.id, ak.name, ak.key_prefix
ORDER BY total_requests DESC
LIMIT 10;
```

## Cleanup & Maintenance

### Clean Up Old Rate Limit Buckets

Run this periodically (e.g., via cron) to remove old rate limit data:

```sql
SELECT cleanup_old_rate_limit_buckets();
```

This removes rate limit buckets older than 7 days.

### Archive Old Usage Logs

To keep the `api_key_usage` table manageable, archive or delete old logs:

```sql
-- Archive to a separate table
INSERT INTO api_key_usage_archive
SELECT * FROM api_key_usage
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old logs
DELETE FROM api_key_usage
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Security Best Practices

1. **Never log full API keys** - Only log the key prefix
2. **Rotate keys regularly** - Set expiration dates
3. **Use minimal scopes** - Only grant necessary permissions
4. **Monitor usage** - Set up alerts for suspicious activity
5. **Revoke compromised keys immediately** - Keys can be deleted instantly

## Troubleshooting

### "Invalid or expired API key"

- Check that the key hasn't expired
- Verify the key is active (`is_active = true`)
- Ensure the full key is being sent, not just the prefix

### "Rate limit exceeded"

- Check the key's rate limits in the UI
- Wait for the rate limit window to reset
- Consider increasing limits or using multiple keys

### "Insufficient permissions"

- Check the key's scopes in the UI
- Update the key with required scopes
- Ensure the API endpoint requires the correct scope

## Example: Creating and Using an API Key

```bash
# 1. Create an API key via the UI or API
curl -X POST http://localhost:4848/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "My Integration",
    "scopes": ["posts:read", "posts:write"]
  }'

# Response:
# {
#   "key": "bc_live_abc123...",
#   "apiKey": { ... }
# }

# 2. Use the API key to make requests
curl -H "Authorization: Bearer bc_live_abc123..." \
  http://localhost:4848/api/posts

# 3. View usage statistics
curl -H "Authorization: Bearer bc_live_abc123..." \
  http://localhost:4848/api/api-keys/KEY_ID/usage
```

## Production Checklist

- [ ] Database migration applied
- [ ] RLS policies verified
- [ ] Rate limiting tested
- [ ] Usage logging working
- [ ] UI accessible at `/app/api-keys`
- [ ] Cleanup cron job configured
- [ ] Monitoring alerts set up
- [ ] Documentation provided to API users

## Support

For issues or questions about the API Keys system, see:
- Database migration: `supabase/migrations/20260112000005_api_keys.sql`
- Service library: `lib/api-key-service.ts`
- Middleware: `lib/api-key-middleware.ts`
- API endpoints: `src/app/api/api-keys/`
- UI components: `src/app/app/api-keys/`, `src/components/api-keys/`
