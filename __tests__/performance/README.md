# BlogCanvas Load Testing

This directory contains k6 load tests for BlogCanvas.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Running Load Tests

### Basic Load Test
Tests 50 concurrent users across all major features:
```bash
npm run test:load
```

### Critical Paths Test
Tests critical user journeys with different load patterns:
```bash
npm run test:load:critical
```

### Spike Test
Tests 100 concurrent users over 5 minutes:
```bash
npm run test:load:spike
```

### Custom Configuration
```bash
# Custom virtual users and duration
k6 run --vus 75 --duration 10m __tests__/performance/k6-load-test.js

# Against staging environment
BASE_URL=https://staging.blogcanvas.com k6 run __tests__/performance/k6-load-test.js

# With custom thresholds
k6 run --out json=results.json __tests__/performance/k6-load-test.js
```

## Test Files

### k6-load-test.js
Main load test covering:
- Authentication flow
- Dashboard loading
- Clients list
- Blog posts
- Websites
- Analytics
- AI Pipeline

**Load profile:**
- Ramp up to 10 users in 30s
- Ramp up to 50 users over 1m
- Maintain 50 users for 2m
- Spike to 100 users over 1m
- Ramp down to 0 in 30s

### k6-critical-paths.js
Critical user journeys:
- Client onboarding (10-20 concurrent users)
- Blog post creation (15-30 concurrent users)
- Analytics dashboard (25 constant users)

## Performance Thresholds

### Success Criteria (VENDOR-WC-019)
- ✅ No errors during test execution
- ✅ Response times < 2x normal (p95 < 2s)
- ✅ No memory leaks detected
- ✅ Error rate < 1%

### Response Time Targets
| Endpoint | Normal | Under Load (p95) |
|----------|--------|------------------|
| Authentication | 250ms | < 500ms |
| Dashboard | 500ms | < 1000ms |
| Clients list | 400ms | < 800ms |
| Blog posts | 500ms | < 1000ms |
| Analytics | 750ms | < 1500ms |
| AI Pipeline | 250ms | < 500ms |

## Interpreting Results

### k6 Output
```
✓ dashboard status is 200
✓ dashboard response time < 1000ms
✓ dashboard has data

checks.........................: 98.50% ✓ 1970  ✗ 30
data_received..................: 12 MB  200 kB/s
data_sent......................: 1.2 MB 20 kB/s
http_req_duration..............: avg=450ms  min=120ms max=1200ms p(95)=850ms p(99)=1100ms
http_req_failed................: 0.50%  ✓ 5     ✗ 995
http_reqs......................: 1000   16.66/s
iterations.....................: 100    1.66/s
vus............................: 50     min=0   max=100
```

### Key Metrics
- **http_req_duration p(95)**: 95% of requests completed within this time
- **http_req_failed**: Percentage of failed requests (should be < 1%)
- **checks**: Percentage of assertions that passed (should be > 95%)
- **vus**: Number of concurrent virtual users

### What to Look For
1. **Response times** - p95 should be < 2x normal
2. **Error rates** - Should be < 1%
3. **Throughput** - Requests per second sustained
4. **Memory** - Check for increasing memory usage (leaks)

## Troubleshooting

### High error rates
- Check API logs for specific errors
- Verify database connection pool size
- Check rate limiting configuration

### Slow response times
- Review database query performance
- Check for N+1 queries
- Verify Redis cache is working
- Monitor CPU and memory usage

### Memory leaks
- Run with `--summary-export=results.json` to track memory over time
- Check for unclosed database connections
- Review event listener cleanup
- Monitor with `htop` or similar during test

## Integration with CI/CD

Add to GitHub Actions:
```yaml
- name: Run load tests
  run: |
    npm run test:load
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

## Cloud Testing

For production-like testing, use k6 Cloud:
```bash
k6 cloud __tests__/performance/k6-load-test.js
```

This provides:
- Distributed load from multiple regions
- Real-time metrics and dashboards
- Historical trend analysis
- Team collaboration features

## Next Steps

After load testing passes:
1. Set up continuous performance monitoring
2. Create performance budgets
3. Add to CI/CD pipeline
4. Monitor production metrics
5. Establish baseline and track trends
