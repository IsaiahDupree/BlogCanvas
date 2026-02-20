# Centralized Log Aggregation

**VENDOR-WC-107**: Structured logging with centralized aggregation

BlogCanvas uses structured JSON logging in production for seamless integration with log aggregation services.

## Current Implementation

BlogCanvas has a comprehensive logging system at `src/lib/logger.ts` with:

- ✅ Structured JSON logs in production
- ✅ Pretty console logs in development
- ✅ Log levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
- ✅ Request ID correlation
- ✅ Context propagation
- ✅ Performance tracking

## Log Format

### Production (JSON)
```json
{
  "timestamp": "2026-01-19T12:34:56.789Z",
  "level": "info",
  "message": "POST /api/clients 200 45ms",
  "context": {
    "service": "BlogCanvas",
    "requestId": "req_abc123",
    "userId": "user_xyz",
    "method": "POST",
    "path": "/api/clients",
    "statusCode": 200,
    "duration": 45
  }
}
```

### Development (Pretty)
```
[INFO] 12:34:56 POST /api/clients 200 45ms { requestId: 'req_abc123', userId: 'user_xyz' }
```

## Log Aggregation Services

### Option 1: Vercel Log Drains (Recommended)

Vercel automatically streams logs to configured drains.

#### Datadog
```bash
# Add Datadog integration in Vercel dashboard
vercel integrations add datadog

# Or via CLI
vercel env add DATADOG_API_KEY
vercel env add DATADOG_SITE # us5.datadoghq.com
```

Configuration in Vercel dashboard:
1. Settings → Integrations → Datadog
2. Enter Datadog API key
3. Select services to monitor
4. Enable log forwarding

#### Logtail (BetterStack)
```bash
# Add Logtail source token
vercel env add LOGTAIL_SOURCE_TOKEN

# Logs automatically forwarded
```

In `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-logtail-token',
            value: process.env.LOGTAIL_SOURCE_TOKEN,
          },
        ],
      },
    ];
  },
};
```

### Option 2: CloudWatch Logs (AWS)

For self-hosted deployments:

```bash
# Install AWS SDK
npm install @aws-sdk/client-cloudwatch-logs

# Set environment variables
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CLOUDWATCH_LOG_GROUP=/blogcanvas/production
```

Update `src/lib/logger.ts`:
```typescript
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const cloudwatch = new CloudWatchLogsClient({
  region: process.env.AWS_REGION,
});

// In output() method:
if (process.env.CLOUDWATCH_LOG_GROUP) {
  await cloudwatch.send(new PutLogEventsCommand({
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
    logStreamName: process.env.NODE_ENV,
    logEvents: [
      {
        timestamp: Date.now(),
        message: JSON.stringify(entry),
      },
    ],
  }));
}
```

### Option 3: Self-Hosted (ELK Stack)

Deploy Elasticsearch + Logstash + Kibana:

```yaml
# docker-compose.elk.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

Logstash configuration:
```
# logstash.conf
input {
  http {
    port => 5044
    codec => json
  }
}

filter {
  json {
    source => "message"
  }

  # Parse log level
  mutate {
    add_field => { "[@metadata][level]" => "%{level}" }
  }

  # Add tags for easier filtering
  if [@metadata][level] == "error" or [@metadata][level] == "critical" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "blogcanvas-logs-%{+YYYY.MM.dd}"
  }
}
```

## Usage in Code

### Basic Logging
```typescript
import { logger } from '@/lib/logger';

// Info log
logger.info('Client created', {
  clientId: 'client_123',
  vendorId: 'vendor_456',
});

// Error log
try {
  await createClient(data);
} catch (error) {
  logger.error('Failed to create client', error as Error, {
    clientData: data,
  });
}
```

### Request Logging
```typescript
import { createRequestLogger } from '@/lib/logger';

export async function POST(request: Request) {
  const reqLogger = createRequestLogger(request);

  reqLogger.info('Processing client creation');

  try {
    const result = await createClient(data);
    reqLogger.info('Client created successfully', {
      clientId: result.id,
    });
    return Response.json(result);
  } catch (error) {
    reqLogger.error('Client creation failed', error as Error);
    throw error;
  }
}
```

### Performance Tracking
```typescript
const startTime = Date.now();

const result = await database.query('SELECT * FROM clients');

logger.database('SELECT', 'clients', Date.now() - startTime, {
  rowCount: result.length,
});
```

### External API Calls
```typescript
const startTime = Date.now();
const response = await fetch('https://api.stripe.com/v1/customers');
const duration = Date.now() - startTime;

logger.externalApi('Stripe', '/v1/customers', response.status, duration);
```

## Log Queries

### Common Searches

#### Find all errors for a specific user
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "match": { "context.userId": "user_123" } }
      ]
    }
  }
}
```

#### Find slow API requests (>2s)
```json
{
  "query": {
    "range": {
      "context.duration": {
        "gte": 2000
      }
    }
  }
}
```

#### Trace a request by ID
```json
{
  "query": {
    "match": {
      "context.requestId": "req_abc123"
    }
  },
  "sort": [
    { "timestamp": "asc" }
  ]
}
```

## Alerting Rules

### Critical Errors
Trigger alert when critical logs appear:
```yaml
# Datadog monitor
type: log alert
query: "level:critical service:BlogCanvas"
message: "Critical error in BlogCanvas production"
notify: ["@pagerduty", "@slack-alerts"]
```

### High Error Rate
Alert on >1% error rate:
```yaml
type: metric alert
query: "sum:blogcanvas.errors{*}.as_rate()"
threshold: 0.01
message: "Error rate exceeds 1%"
```

### Slow Requests
Alert on p95 response time >2s:
```yaml
type: metric alert
query: "p95:blogcanvas.request.duration{*}"
threshold: 2000
message: "API response time degraded"
```

## Log Retention

### Retention Policies
- **Hot tier**: Last 7 days (fast search)
- **Warm tier**: 8-30 days (slower search)
- **Cold tier**: 31-90 days (archive)
- **Deletion**: After 90 days

Configure in Elasticsearch:
```bash
PUT _ilm/policy/blogcanvas-logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {}
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "allocate": {
            "number_of_replicas": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## Log Sampling

For high-volume production, sample non-error logs:

```typescript
// In src/lib/logger.ts

private shouldSample(level: LogLevel): boolean {
  // Always log errors and warnings
  if (level === LogLevel.ERROR || level === LogLevel.CRITICAL || level === LogLevel.WARN) {
    return true;
  }

  // Sample 10% of info/debug logs in production
  if (process.env.NODE_ENV === 'production') {
    return Math.random() < 0.1;
  }

  return true;
}
```

## Dashboards

### Key Metrics Dashboard

Track:
- Request rate (requests/minute)
- Error rate (%)
- Response time (p50, p95, p99)
- Database query time
- External API latency

### User Activity Dashboard

Monitor:
- Active users
- Authentication events
- Failed login attempts
- API usage per user

### Infrastructure Dashboard

Observe:
- Memory usage
- CPU usage
- Database connections
- Cache hit rate

## Cost Optimization

### Tips
1. **Sample verbose logs** - Only send 10% of DEBUG logs
2. **Short retention for DEBUG** - Keep only 7 days
3. **Archive old logs** to S3 (cheaper storage)
4. **Filter before sending** - Don't send health check logs
5. **Use log levels wisely** - Reserve ERROR for actual errors

### Example Filtering
```typescript
// Don't log health checks
if (path === '/api/health') {
  return;
}

// Don't log successful OPTIONS requests
if (method === 'OPTIONS' && statusCode === 200) {
  return;
}
```

## Success Criteria (VENDOR-WC-107)

- ✅ JSON logs in production
- ✅ Request ID tracking
- ✅ Log levels properly used
- ✅ Integration ready for Datadog/Logtail/CloudWatch
- ✅ Error tracking with Sentry
- ✅ Performance metrics logged

## Recommended Setup

For BlogCanvas on Vercel:
1. **Use Vercel Log Drains** → Logtail (BetterStack)
2. **Sentry for errors** (already configured)
3. **Datadog for APM** (optional, for advanced metrics)

Cost: ~$29/month for Logtail Startup plan

## Next Steps

1. Configure log drain in Vercel dashboard
2. Set up Logtail/Datadog account
3. Create dashboard for key metrics
4. Set up alerts for critical errors
5. Train team on log querying
