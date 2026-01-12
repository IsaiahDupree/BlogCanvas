# Webhook System Setup Guide

## Overview

The webhook system allows vendors to register endpoint URLs to receive real-time notifications about events in their BlogCanvas account. This enables integration with external systems and automation workflows.

## Features

- **Event Subscriptions**: Subscribe to 16 different event types
- **Signature Verification**: HMAC-SHA256 signatures for security
- **Automatic Retries**: Configurable retry logic with exponential backoff
- **Delivery Logs**: Complete history of webhook deliveries
- **Test Functionality**: Send test webhooks to verify configuration
- **Rate Limiting**: Per-webhook timeout and retry configuration

## Database Tables

### `webhooks`
Stores vendor webhook configurations.

**Columns:**
- `id`: Unique webhook identifier
- `vendor_id`: Associated vendor
- `name`: Friendly name for the webhook
- `url`: Endpoint URL (must be HTTPS)
- `events`: Array of subscribed event names
- `secret`: HMAC secret for signature verification
- `is_active`: Enable/disable webhook
- `retry_count`: Maximum retry attempts (default: 3)
- `retry_delay_seconds`: Initial retry delay (default: 60)
- `timeout_seconds`: Request timeout (default: 30)
- `headers`: Optional custom headers (JSONB)
- `last_triggered_at`: Timestamp of last event
- `created_at`, `updated_at`, `created_by`

### `webhook_deliveries`
Tracks individual webhook delivery attempts.

**Columns:**
- `id`: Unique delivery identifier
- `webhook_id`: Associated webhook
- `event`: Event name (e.g., "post.created")
- `payload`: Full event payload (JSONB)
- `status`: 'pending', 'delivered', 'failed', 'retrying'
- `response_status`: HTTP status code from endpoint
- `response_body`: Response body (truncated)
- `response_headers`: Response headers (JSONB)
- `error_message`: Error details if failed
- `attempts`: Number of delivery attempts
- `delivered_at`: Timestamp of successful delivery
- `next_retry_at`: Scheduled retry time
- `completed_at`: Final completion timestamp
- `created_at`

### `webhook_events_log`
Audit log of all triggered events.

**Columns:**
- `id`: Unique log entry identifier
- `vendor_id`: Associated vendor
- `event`: Event name
- `payload`: Event payload (JSONB)
- `webhook_count`: Number of webhooks triggered
- `created_at`

## Available Events

| Event | Description | Payload Fields |
|-------|-------------|----------------|
| `post.created` | New blog post created | `post_id`, `client_id`, `topic`, `status` |
| `post.status_changed` | Post status updated | `post_id`, `old_status`, `new_status` |
| `post.published` | Post published to CMS | `post_id`, `cms_url`, `publish_date` |
| `post.updated` | Post content updated | `post_id`, `updated_fields` |
| `post.deleted` | Post deleted | `post_id` |
| `client.created` | New client added | `client_id`, `name`, `website` |
| `client.updated` | Client info updated | `client_id`, `updated_fields` |
| `client.deleted` | Client removed | `client_id` |
| `batch.created` | Content batch created | `batch_id`, `client_id`, `post_count` |
| `batch.completed` | Batch completed | `batch_id`, `completion_date` |
| `review.requested` | Content review requested | `post_id`, `reviewer`, `deadline` |
| `review.completed` | Review completed | `post_id`, `decision`, `comments` |
| `invoice.created` | Invoice created | `invoice_id`, `amount`, `client` |
| `invoice.updated` | Invoice updated | `invoice_id`, `status` |
| `payment.received` | Payment received | `invoice_id`, `amount`, `method` |
| `payment.failed` | Payment failed | `invoice_id`, `error_message` |

## API Endpoints

### GET /api/webhooks
List all webhooks for the authenticated vendor.

**Response:**
```json
{
  "webhooks": [
    {
      "id": "uuid",
      "name": "Production Webhook",
      "url": "https://example.com/webhooks/blogcanvas",
      "events": ["post.created", "post.published"],
      "is_active": true,
      "secret_preview": "a1b2c3d4...",
      "retry_count": 3,
      "timeout_seconds": 30,
      "last_triggered_at": "2026-01-12T10:30:00Z",
      "created_at": "2026-01-10T08:00:00Z"
    }
  ],
  "available_events": ["post.created", "post.status_changed", ...]
}
```

### POST /api/webhooks
Create a new webhook.

**Request Body:**
```json
{
  "name": "Production Webhook",
  "url": "https://example.com/webhooks/blogcanvas",
  "events": ["post.created", "post.published"],
  "retry_count": 3,
  "retry_delay_seconds": 60,
  "timeout_seconds": 30,
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

**Response:**
```json
{
  "webhook": {
    "id": "uuid",
    "name": "Production Webhook",
    "secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
  },
  "message": "Webhook created successfully. Save the secret - it will not be shown again."
}
```

**Important:** The webhook secret is only shown once at creation time. Save it securely!

### GET /api/webhooks/[id]
Get webhook details.

### PATCH /api/webhooks/[id]
Update webhook configuration.

### DELETE /api/webhooks/[id]
Delete webhook.

### GET /api/webhooks/[id]/deliveries
Get delivery logs with statistics.

**Query Parameters:**
- `status`: Filter by status (pending, delivered, failed, retrying)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "deliveries": [...],
  "stats": {
    "total_deliveries": 150,
    "successful_deliveries": 145,
    "failed_deliveries": 5,
    "pending_deliveries": 0,
    "avg_attempts": 1.03,
    "success_rate": 96.67
  },
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### POST /api/webhooks/[id]/test
Send a test webhook delivery.

### POST /api/webhooks/process
Process pending webhook deliveries (cron endpoint).

## Webhook Payload Format

All webhooks receive a POST request with this JSON structure:

```json
{
  "id": "event-uuid",
  "event": "post.created",
  "timestamp": "2026-01-12T10:30:00Z",
  "vendor_id": "vendor-uuid",
  "data": {
    // Event-specific data
    "post_id": "uuid",
    "client_id": "uuid",
    "topic": "Example Blog Post",
    "status": "draft"
  }
}
```

## Webhook Headers

Every webhook request includes these headers:

- `Content-Type: application/json`
- `X-Webhook-Signature`: HMAC-SHA256 signature of the payload
- `X-Webhook-Event`: Event name (e.g., "post.created")
- `X-Webhook-Delivery-ID`: Unique delivery identifier
- `User-Agent: BlogCanvas-Webhooks/1.0`
- Any custom headers configured for the webhook

## Signature Verification

Verify webhook signatures to ensure requests are from BlogCanvas:

### Node.js Example
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express middleware example
app.post('/webhooks/blogcanvas', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString('utf8');
  const secret = process.env.BLOGCANVAS_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  console.log('Received event:', event.event, event.data);

  res.status(200).json({ received: true });
});
```

### Python Example
```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# Flask example
@app.route('/webhooks/blogcanvas', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data(as_text=True)
    secret = os.environ.get('BLOGCANVAS_WEBHOOK_SECRET')

    if not verify_webhook_signature(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401

    event = request.get_json()
    print(f"Received event: {event['event']}", event['data'])

    return jsonify({'received': True}), 200
```

## Retry Logic

Webhooks use exponential backoff for retries:

1. **First attempt**: Immediate delivery
2. **Retry 1**: After 2 minutes (2^1 * 60s)
3. **Retry 2**: After 4 minutes (2^2 * 60s)
4. **Retry 3**: After 8 minutes (2^3 * 60s)
5. **Final status**: Marked as 'failed' after max retries

**Retry Triggers:**
- HTTP status codes 5xx (server errors)
- Network errors (timeout, connection refused)
- DNS resolution failures

**Non-retriable Failures:**
- HTTP status codes 4xx (client errors)
- Invalid SSL certificates

## Cron Job Setup

The webhook processor must run periodically to deliver pending webhooks.

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/webhooks/process",
    "schedule": "*/5 * * * *"
  }]
}
```

### Option 2: GitHub Actions

Create `.github/workflows/webhook-processor.yml`:
```yaml
name: Process Webhooks
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger webhook processing
        run: |
          curl -X POST https://your-app.vercel.app/api/webhooks/process \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 3: External Cron Service

Use services like cron-job.org or EasyCron:
- URL: `https://your-app.vercel.app/api/webhooks/process`
- Method: POST
- Header: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every 5 minutes

### Environment Variable

Set `CRON_SECRET` in your environment:
```bash
CRON_SECRET=your-random-secret-here
```

## Best Practices

### Endpoint Implementation

1. **Respond Quickly**: Return 200 OK within 30 seconds
2. **Process Async**: Queue webhook data for background processing
3. **Verify Signatures**: Always verify the X-Webhook-Signature header
4. **Idempotency**: Handle duplicate deliveries gracefully (use event ID)
5. **Error Handling**: Return appropriate HTTP status codes:
   - 200-299: Success (no retry)
   - 400-499: Client error (no retry)
   - 500-599: Server error (will retry)

### Security

1. **HTTPS Only**: Webhook URLs must use HTTPS
2. **Secret Management**: Store webhook secrets securely (environment variables, secret managers)
3. **IP Allowlist**: Optionally restrict webhook requests to BlogCanvas IP ranges
4. **Rate Limiting**: Implement rate limiting on your webhook endpoint

### Monitoring

1. **Check Delivery Stats**: Regularly review webhook delivery success rates
2. **Alert on Failures**: Set up alerts for webhook delivery failures
3. **Audit Logs**: Monitor the webhook_events_log table
4. **Cleanup**: Old deliveries are automatically cleaned after 90 days

## Troubleshooting

### Common Issues

**Webhooks Not Being Delivered:**
- Check that webhook is_active = true
- Verify cron job is running (`POST /api/webhooks/process`)
- Check webhook_deliveries table for error_message
- Ensure endpoint URL is accessible from the internet

**Signature Verification Fails:**
- Verify you're using the correct secret
- Ensure you're hashing the raw body (before JSON parsing)
- Check that you're using HMAC-SHA256
- Use crypto.timingSafeEqual for comparison (prevents timing attacks)

**High Failure Rate:**
- Check endpoint response times (must be < 30s)
- Verify endpoint returns 200 status code
- Check endpoint logs for errors
- Test webhook using "Test" button in UI

**Duplicate Events:**
- Implement idempotency using event.id
- Store processed event IDs to detect duplicates

## Monitoring Queries

### Get delivery stats for all webhooks
```sql
SELECT
  w.name,
  COUNT(wd.id) as total_deliveries,
  COUNT(*) FILTER (WHERE wd.status = 'delivered') as successful,
  COUNT(*) FILTER (WHERE wd.status = 'failed') as failed,
  ROUND(AVG(wd.attempts), 2) as avg_attempts
FROM webhooks w
LEFT JOIN webhook_deliveries wd ON wd.webhook_id = w.id
WHERE w.vendor_id = 'your-vendor-id'
  AND wd.created_at >= NOW() - INTERVAL '30 days'
GROUP BY w.id, w.name;
```

### Find failing webhooks
```sql
SELECT
  w.name,
  w.url,
  COUNT(*) as failure_count,
  MAX(wd.error_message) as last_error
FROM webhooks w
INNER JOIN webhook_deliveries wd ON wd.webhook_id = w.id
WHERE w.vendor_id = 'your-vendor-id'
  AND wd.status = 'failed'
  AND wd.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY w.id, w.name, w.url
ORDER BY failure_count DESC;
```

### Get recent events
```sql
SELECT
  event,
  webhook_count,
  created_at
FROM webhook_events_log
WHERE vendor_id = 'your-vendor-id'
ORDER BY created_at DESC
LIMIT 50;
```

## Frontend UI

### Webhooks Page
Navigate to `/app/webhooks` to manage webhooks.

**Features:**
- List all configured webhooks
- Create new webhooks with event selection
- View webhook details and delivery logs
- Test webhook endpoints
- Enable/disable webhooks
- Delete webhooks

### Creating a Webhook

1. Click "Create Webhook"
2. Enter webhook name and endpoint URL (must be HTTPS)
3. Select events to subscribe to
4. Configure retry and timeout settings (optional)
5. Click "Create"
6. **Important:** Copy the webhook secret (shown only once!)

### Viewing Delivery Logs

1. Click "Details" on a webhook
2. Go to "Deliveries" tab
3. View delivery history with status, attempts, and errors
4. Click "Refresh" to update delivery stats

## Production Checklist

- [ ] Database migration applied (`npx supabase db push`)
- [ ] Environment variables configured (CRON_SECRET)
- [ ] Cron job configured (Vercel Cron, GitHub Actions, or external)
- [ ] Webhook endpoints implemented with signature verification
- [ ] SSL/TLS certificates valid on webhook endpoints
- [ ] Monitoring set up for delivery failures
- [ ] Tested webhook deliveries end-to-end

## Support

For issues or questions about the webhook system:
1. Check delivery logs in the webhook details
2. Review error messages in webhook_deliveries table
3. Test webhook using the "Test" button
4. Check cron job is running (POST /api/webhooks/process)
5. Verify endpoint is accessible and returns 200 OK
