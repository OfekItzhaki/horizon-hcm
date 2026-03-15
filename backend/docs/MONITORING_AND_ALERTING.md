# Monitoring and Alerting Configuration

## Overview

This document describes the monitoring and alerting infrastructure for the Horizon-HCM application. The system provides real-time monitoring of application health, performance metrics, and deployment status with automated alerting for critical issues.

## Architecture

### Components

1. **MonitoringService**: Tracks performance metrics and triggers alerts based on configurable conditions
2. **DeploymentHealthMonitorService**: Monitors deployment health including database, Redis, and memory
3. **Performance Interceptor**: Collects request/response metrics
4. **Logger Service**: Aggregates logs with Winston and sends to Seq

### Alert Types

#### Critical Alerts
- **Server Errors (5xx)**: Triggered when HTTP 500+ errors occur
- **High Error Rate**: Triggered when error rate exceeds 5%
- **Unhealthy Deployment**: Triggered when multiple health checks fail
- **Error Rate Spike**: Triggered when error rate exceeds 10% in monitoring window

#### Warning Alerts
- **Slow Response Time**: Triggered when response time exceeds 5 seconds
- **High Database Query Count**: Triggered when query count exceeds 50 per request
- **High Memory Usage**: Triggered when heap usage exceeds 90%

#### Info Alerts
- **Low Cache Hit Rate**: Triggered when cache hit rate falls below 30%

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Monitoring
MONITORING_ENABLED=true
MONITORING_CHECK_INTERVAL=60000  # milliseconds
MONITORING_BUFFER_SIZE=100

# Health Check
HEALTH_CHECK_INTERVAL=30000      # milliseconds
HEALTH_CHECK_TIMEOUT=5000        # milliseconds

# Alert Thresholds
ALERT_ERROR_RATE_THRESHOLD=0.05  # 5%
ALERT_RESPONSE_TIME_THRESHOLD=5000  # milliseconds
ALERT_DB_QUERY_THRESHOLD=50
ALERT_CACHE_HIT_RATE_THRESHOLD=0.3  # 30%
ALERT_MEMORY_THRESHOLD=0.9  # 90%
```

### Seq Configuration

Seq is used for centralized log aggregation and alerting. Configure Seq in your deployment:

```bash
# Seq Server
SEQ_SERVER_URL=http://seq-server:5341
SEQ_API_KEY=your-seq-api-key
```

#### Seq Alert Rules

Create these alert rules in Seq:

**1. Critical Error Alert**
```
Level = "Error" and @MessageTemplate like "%ALERT%"
```
- Action: Send email to ops-team@company.com
- Condition: Trigger immediately

**2. Error Rate Spike Alert**
```
@MessageTemplate like "%Error Rate Spike%" 
```
- Action: Send email and Slack notification
- Condition: Trigger immediately

**3. Deployment Unhealthy Alert**
```
@MessageTemplate like "%CRITICAL: Deployment is unhealthy%"
```
- Action: Send email, Slack, and PagerDuty alert
- Condition: Trigger immediately

**4. High Memory Usage Alert**
```
@MessageTemplate like "%High memory usage detected%"
```
- Action: Send email notification
- Condition: Trigger immediately

**5. Slow Response Alert**
```
@MessageTemplate like "%Slow response detected%" and @Properties.responseTime > 5000
```
- Action: Send Slack notification
- Condition: Trigger if 3+ occurrences in 5 minutes

## Integration Points

### Performance Interceptor Integration

The PerformanceInterceptor automatically collects metrics and passes them to MonitoringService:

```typescript
// In performance.interceptor.ts
const metrics: PerformanceMetrics = {
  endpoint: request.url,
  method: request.method,
  responseTime: duration,
  statusCode: response.statusCode,
  errorRate: errorCount / totalRequests,
  timestamp: new Date(),
  dbQueryCount: queryCount,
  cacheHitRate: cacheHits / totalCacheRequests,
};

this.monitoringService.recordMetrics(metrics);
```

### Health Check Endpoints

The application exposes health check endpoints for deployment monitoring:

```bash
# Basic health check
GET /health

# Readiness probe (for Kubernetes)
GET /health/ready

# Detailed health status
GET /health/detailed
```

Response format:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-12T10:30:00Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "redis": {
      "status": "up",
      "responseTime": 12
    },
    "memory": {
      "status": "up"
    },
    "uptime": 3600000
  }
}
```

## Deployment Health Monitoring

### Automatic Checks

The DeploymentHealthMonitorService performs these checks every 30 seconds:

1. **Database Connectivity**: Executes a simple query to verify database is accessible
2. **Redis Connectivity**: Sets and retrieves a test key
3. **Memory Usage**: Checks heap usage percentage
4. **Uptime**: Tracks application uptime

### Alert Conditions

- **Degraded**: One health check fails
- **Unhealthy**: Two or more health checks fail
- **Critical**: Database or Redis is down

## Monitoring Dashboard

### Recommended Metrics to Track

1. **Request Metrics**
   - Request count per endpoint
   - Response time percentiles (p50, p95, p99)
   - Error rate by endpoint
   - Status code distribution

2. **Performance Metrics**
   - Database query count per request
   - Cache hit rate
   - Memory usage over time
   - CPU usage

3. **Health Metrics**
   - Deployment status (healthy/degraded/unhealthy)
   - Service availability
   - Error rate trends
   - Response time trends

### Seq Dashboard Setup

Create a dashboard in Seq with these queries:

**Error Rate Over Time**
```
select count() as ErrorCount, @Timestamp 
where Level = "Error" 
group by time(5m)
```

**Response Time Distribution**
```
select @Properties.responseTime 
where @MessageTemplate like "%Performance%"
```

**Health Status Timeline**
```
select @Properties.status, @Timestamp 
where @MessageTemplate like "%health status%"
```

## Alert Escalation

### Escalation Policy

1. **Info Level**: Log only
2. **Warning Level**: Email to team
3. **Critical Level**: Email + Slack + PagerDuty

### On-Call Rotation

Configure PagerDuty integration in Seq for critical alerts:

```bash
# PagerDuty Configuration
PAGERDUTY_INTEGRATION_KEY=your-integration-key
PAGERDUTY_SERVICE_ID=your-service-id
```

## Troubleshooting

### High Error Rate

1. Check application logs in Seq
2. Review recent deployments
3. Check database connectivity
4. Review error stack traces

### Slow Response Times

1. Check database query performance
2. Review cache hit rates
3. Check memory usage
4. Review external API calls

### Memory Leaks

1. Monitor heap usage over time
2. Take heap snapshots
3. Analyze object retention
4. Review event listeners

### Deployment Health Issues

1. Check database connectivity: `GET /health`
2. Check Redis connectivity: `GET /health`
3. Review system resources
4. Check network connectivity

## Best Practices

1. **Set Appropriate Thresholds**: Adjust alert thresholds based on your SLAs
2. **Monitor Trends**: Look for gradual degradation, not just spikes
3. **Test Alerts**: Regularly test alert delivery mechanisms
4. **Document Runbooks**: Create runbooks for each alert type
5. **Review Regularly**: Review alert effectiveness monthly
6. **Tune Sensitivity**: Reduce false positives by tuning thresholds
7. **Correlate Events**: Look for patterns across multiple metrics

## Integration with CI/CD

### Pre-Deployment Checks

```bash
# In deploy.sh
./scripts/validate-health.sh

# Verify deployment health
curl -f http://localhost:3001/health/ready || exit 1
```

### Post-Deployment Monitoring

```bash
# Monitor for 5 minutes after deployment
for i in {1..30}; do
  curl http://localhost:3001/health/detailed
  sleep 10
done
```

## Metrics Export

### Prometheus Integration (Optional)

To export metrics to Prometheus:

```typescript
// In monitoring.service.ts
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
```

Expose metrics endpoint:
```bash
GET /metrics
```

## References

- [Seq Documentation](https://docs.datalust.co/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [NestJS Health Checks](https://docs.nestjs.com/recipes/terminus)
- [Prometheus Metrics](https://prometheus.io/docs/concepts/data_model/)
