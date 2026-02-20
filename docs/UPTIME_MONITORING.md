# Uptime Monitoring

**VENDOR-WC-114**: External uptime checks with HTTP checks and alerts

## Health Check Endpoint

BlogCanvas provides a comprehensive health check endpoint at `/api/health`:

### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T12:34:56.789Z",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "pass",
      "responseTime": 45
    },
    "storage": {
      "status": "pass",
      "responseTime": 23
    },
    "config": {
      "status": "pass"
    }
  }
}
```

### Status Codes
- `200 OK` - System healthy
- `503 Service Unavailable` - System unhealthy or degraded

### Check Details
| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| database | Supabase connection | Query completes in <1s |
| storage | Supabase Storage | Bucket list succeeds |
| config | Environment variables | All required vars present |

## Monitoring Services Setup

### Option 1: Vercel Monitoring (Recommended)

Vercel provides built-in monitoring for deployments.

**Features:**
- Automatic uptime checks
- Function execution monitoring
- Error rate tracking
- Performance metrics

**Setup:**
1. Navigate to Vercel dashboard
2. Select BlogCanvas project
3. Go to "Analytics" tab
4. Enable monitoring

**Alerts:**
Configure in Vercel → Settings → Alerts:
- Deployment failed
- Function errors exceed threshold
- Response time degraded

### Option 2: UptimeRobot (Free Tier Available)

**Setup:**
```bash
# 1. Create account at uptimerobot.com
# 2. Add new monitor:
```

Configuration:
- **Monitor Type**: HTTP(S)
- **URL**: `https://blogcanvas.com/api/health`
- **Monitoring Interval**: 5 minutes (free tier)
- **Alert Contacts**: Email, Slack, SMS

**Status Page:**
Create public status page at `status.blogcanvas.com`

### Option 3: Better Uptime (BetterStack)

**Pricing**: Free tier: 10 monitors, 3-minute checks

**Setup:**
```bash
# 1. Sign up at betteruptime.com
# 2. Create HTTP monitor
```

Configuration:
- **URL**: `https://blogcanvas.com/api/health`
- **Method**: GET
- **Expected Status**: 200
- **Check Interval**: 3 minutes
- **Incident**: Create on-call schedules

**Advanced Checks:**
```json
{
  "url": "https://blogcanvas.com/api/health",
  "method": "GET",
  "expected_status_codes": [200],
  "expected_response_time": 2000,
  "assertions": [
    {
      "type": "json_path",
      "path": "$.status",
      "comparison": "equals",
      "value": "healthy"
    }
  ]
}
```

### Option 4: Pingdom (Paid)

**Features:**
- Real user monitoring (RUM)
- Transaction monitoring
- Page speed monitoring
- Multi-location checks

**Setup:**
```bash
# 1. Create account at pingdom.com
# 2. Add uptime check
```

Configuration:
- **Check Type**: HTTP Check
- **URL**: `https://blogcanvas.com/api/health`
- **Check Interval**: 1 minute
- **Locations**: Multiple regions (US, EU, Asia)

### Option 5: Cronitor

**Pricing**: $10/month for 100 monitors

**Setup via API:**
```bash
curl https://cronitor.io/api/monitors \
  -H "Content-Type: application/json" \
  -u "api_key_here:" \
  -d '{
    "name": "BlogCanvas API",
    "type": "check",
    "schedule": "every 5 minutes",
    "assertions": [
      "metric.response_time < 2000",
      "metric.status_code == 200"
    ],
    "request": {
      "url": "https://blogcanvas.com/api/health",
      "method": "GET"
    }
  }'
```

## Custom Monitoring Script

For self-hosted monitoring:

```bash
#!/bin/bash
# monitor-uptime.sh

HEALTH_URL="https://blogcanvas.com/api/health"
ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Perform health check
RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

# Check if healthy
if [ "$HTTP_CODE" != "200" ]; then
  # Send alert
  curl -X POST "$ALERT_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"🚨 BlogCanvas health check failed\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"fields\": [
          {\"title\": \"Status Code\", \"value\": \"$HTTP_CODE\", \"short\": true},
          {\"title\": \"Response\", \"value\": \"$BODY\", \"short\": false}
        ]
      }]
    }"
fi

# Log result
echo "$(date) - Health check: HTTP $HTTP_CODE" >> /var/log/blogcanvas-uptime.log
```

Run via cron:
```bash
# Check every 5 minutes
*/5 * * * * /path/to/monitor-uptime.sh
```

## Alert Configuration

### Slack Integration

1. Create Slack webhook:
```bash
# In Slack: Settings → Integrations → Incoming Webhooks
```

2. Configure alerts in monitoring service to post to webhook

3. Example alert message:
```json
{
  "text": "BlogCanvas Alert",
  "attachments": [{
    "color": "danger",
    "title": "Health Check Failed",
    "fields": [
      {"title": "Service", "value": "BlogCanvas API", "short": true},
      {"title": "Status", "value": "Unhealthy", "short": true},
      {"title": "Time", "value": "2026-01-19 12:34:56", "short": false}
    ]
  }]
}
```

### PagerDuty Integration

For on-call rotations:

```bash
# 1. Create PagerDuty service
# 2. Get integration key
# 3. Configure in monitoring service
```

**Escalation Policy:**
- Alert primary on-call immediately
- Escalate to secondary after 5 minutes
- Escalate to manager after 15 minutes

### Email Alerts

Configure SMTP for email notifications:

```bash
# .env
ALERT_EMAIL_TO=ops@blogcanvas.com
ALERT_EMAIL_FROM=alerts@blogcanvas.com
SMTP_HOST=smtp.resend.com
SMTP_USER=resend
SMTP_PASS=your-api-key
```

## Status Page

### Public Status Page

Create public-facing status page:

**Options:**
1. **Statuspage.io** (by Atlassian) - $29/month
2. **Cachet** (self-hosted, free)
3. **Better Uptime Status Pages** - Included with plan
4. **Custom page** with UptimeRobot widget

**Example status page** (`status.blogcanvas.com`):
```html
<!DOCTYPE html>
<html>
<head>
  <title>BlogCanvas Status</title>
</head>
<body>
  <h1>BlogCanvas Status</h1>
  <script src="https://uptime.betterstack.com/widgets/announcement.js" data-id="YOUR_ID"></script>

  <div id="current-status"></div>
  <div id="uptime-chart"></div>
  <div id="incident-history"></div>
</body>
</html>
```

## Monitoring Checklist

### HTTP Checks
- [ ] `/api/health` returns 200
- [ ] Response time < 2 seconds
- [ ] Database check passes
- [ ] Storage check passes

### Alerts
- [ ] Slack notifications configured
- [ ] Email alerts set up
- [ ] PagerDuty (if using) connected
- [ ] Alert thresholds defined

### Status Page
- [ ] Public status page live
- [ ] Incident history visible
- [ ] Subscribe to updates enabled

## Metrics to Monitor

### Availability
- **Target**: 99.9% uptime (43 minutes downtime/month)
- **Measure**: Successful health checks / Total checks

### Response Time
- **Target**: p95 < 2 seconds
- **Measure**: Health check response time

### Error Rate
- **Target**: < 0.1% errors
- **Measure**: Failed requests / Total requests

### Database Performance
- **Target**: Query time < 1 second
- **Measure**: Database check response time

## Incident Response

### On Alert Received

1. **Acknowledge** - Confirm you're investigating
2. **Assess** - Check health endpoint, logs, Sentry
3. **Diagnose** - Identify failing component
4. **Mitigate** - Restore service (rollback, restart, etc.)
5. **Communicate** - Update status page
6. **Resolve** - Mark incident as resolved
7. **Post-mortem** - Document lessons learned

### Example Incident Workflow

```bash
# 1. Acknowledge
curl -X POST $PAGERDUTY_WEBHOOK -d '{"status": "acknowledged"}'

# 2. Check health endpoint
curl https://blogcanvas.com/api/health | jq

# 3. Check logs
vercel logs --prod | grep ERROR

# 4. Check Sentry
# Navigate to sentry.io/blogcanvas/issues

# 5. Rollback if needed
vercel rollback

# 6. Update status page
# Post incident update

# 7. Resolve
curl -X POST $PAGERDUTY_WEBHOOK -d '{"status": "resolved"}'
```

## Success Criteria (VENDOR-WC-114)

- ✅ HTTP health checks configured
- ✅ Alerts set up for failures
- ✅ Status page available
- ✅ On-call rotation defined
- ✅ Incident response process documented

## Next Steps

1. Choose monitoring service (UptimeRobot recommended for free tier)
2. Configure health check monitoring
3. Set up Slack/email alerts
4. Create public status page
5. Test alert workflow
6. Document on-call procedures
