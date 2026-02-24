# Load Testing for Horizon-HCM

This directory contains load testing scripts for the Horizon-HCM API using [k6](https://k6.io/).

## Prerequisites

Install k6:

**Windows (using Chocolatey):**
```bash
choco install k6
```

**macOS (using Homebrew):**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Configuration

Before running tests, update the `BASE_URL` in each scenario file to match your environment:

- **Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.horizon-hcm.com`
- **Production**: `https://api.horizon-hcm.com`

## Running Tests

### Individual Scenarios

Run a specific scenario:

```bash
# Authentication load test
k6 run scenarios/auth.test.js

# Reports load test
k6 run scenarios/reports.test.js

# Apartments load test
k6 run scenarios/apartments.test.js
```

### Custom Load Profiles

Run with custom virtual users and duration:

```bash
# 10 VUs for 30 seconds
k6 run --vus 10 --duration 30s scenarios/auth.test.js

# Ramp up to 100 VUs over 2 minutes
k6 run --stage 2m:100 scenarios/reports.test.js
```

### All Scenarios

Run all scenarios sequentially:

```bash
# Windows (PowerShell)
Get-ChildItem scenarios/*.js | ForEach-Object { k6 run $_.FullName }

# Linux/macOS
for file in scenarios/*.js; do k6 run "$file"; done
```

## Load Profiles

Each scenario includes three load profiles:

### 1. Smoke Test (Default)
- **Purpose**: Verify the script works with minimal load
- **VUs**: 1
- **Duration**: 30 seconds
- **Usage**: `k6 run scenarios/auth.test.js`

### 2. Load Test
- **Purpose**: Test normal expected load
- **VUs**: Ramp 0 → 50 → 0
- **Duration**: 5 minutes
- **Usage**: `k6 run -e LOAD_PROFILE=load scenarios/auth.test.js`

### 3. Stress Test
- **Purpose**: Find breaking point
- **VUs**: Ramp 0 → 100 → 200 → 0
- **Duration**: 10 minutes
- **Usage**: `k6 run -e LOAD_PROFILE=stress scenarios/auth.test.js`

### 4. Spike Test
- **Purpose**: Test sudden traffic spikes
- **VUs**: Ramp 0 → 200 (instant) → 0
- **Duration**: 3 minutes
- **Usage**: `k6 run -e LOAD_PROFILE=spike scenarios/auth.test.js`

## Performance Thresholds

Each scenario defines performance thresholds:

- **HTTP errors**: < 1%
- **Response time (p95)**: < 500ms
- **Response time (p99)**: < 1000ms

Tests will fail if thresholds are not met.

## Interpreting Results

k6 provides detailed metrics:

```
✓ http_req_duration..............: avg=245ms  min=120ms med=230ms max=890ms  p(90)=380ms p(95)=450ms
✓ http_req_failed................: 0.12%   ✓ 3        ✗ 2497
✓ http_reqs......................: 2500    83.33/s
✓ vus............................: 50      min=1      max=50
```

**Key Metrics:**
- `http_req_duration`: Response time distribution
- `http_req_failed`: Percentage of failed requests
- `http_reqs`: Total requests and requests per second
- `vus`: Virtual users (concurrent users)

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run load tests
        run: |
          cd backend/load-tests
          k6 run scenarios/auth.test.js
          k6 run scenarios/reports.test.js
          k6 run scenarios/apartments.test.js
```

## Best Practices

1. **Start Small**: Begin with smoke tests, then gradually increase load
2. **Test Realistic Scenarios**: Use actual user workflows
3. **Monitor Resources**: Watch CPU, memory, and database connections
4. **Test in Staging**: Never run stress tests against production
5. **Analyze Results**: Look for bottlenecks and optimization opportunities
6. **Regular Testing**: Run load tests regularly to catch regressions

## Troubleshooting

### Connection Refused
- Ensure the API server is running
- Check the `BASE_URL` in scenario files
- Verify firewall settings

### High Error Rate
- Check server logs for errors
- Verify database connections
- Check Redis availability
- Monitor resource usage (CPU, memory)

### Slow Response Times
- Check database query performance
- Review caching strategy
- Monitor network latency
- Check for N+1 queries

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
