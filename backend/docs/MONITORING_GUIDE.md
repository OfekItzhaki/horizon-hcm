# Monitoring Guide

**Last Updated**: 2026-02-24  
**Version**: 1.0

Complete guide to monitoring, observability, and alerting for Horizon-HCM.

---

## Table of Contents

1. [Overview](#overview)
2. [Application Performance Monitoring (APM)](#application-performance-monitoring-apm)
3. [Log Aggregation](#log-aggregation)
4. [Metrics Collection](#metrics-collection)
5. [Alerting Configuration](#alerting-configuration)
6. [Dashboard Setup](#dashboard-setup)
7. [Best Practices](#best-practices)

---

## Overview

Horizon-HCM uses a comprehensive monitoring stack:

- **APM**: Application performance and distributed tracing
- **Logs**: Centralized log aggregation with Seq
- **Metrics**: Performance metrics stored in database
- **Alerts**: Real-time notifications via Slack/Email/PagerDuty

### Monitoring Architecture

```
Application
    ├── APM Agent → APM Service (New Relic/DataDog/Elastic)
    ├── Logs → Seq Server
    ├── Metrics → PostgreSQL (performance_metrics table)
    └── Health Checks → Load Balancer
```

---

## Application Performance Monitoring (APM)

### Choosing an APM Solution

Horizon-HCM supports multiple APM providers:

| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **New Relic** | Easy setup, great UI | Expensive | Enterprise |
| **DataDog** | Comprehensive, integrations | Complex pricing | Large teams |
| **Elastic APM** | Open source, customizable | Self-hosted | Cost-conscious |
| **AWS X-Ray** | AWS integration | AWS-only | AWS deployments |

### Setup: New Relic

#### 1. Install New Relic Agent

```bash
npm install newrelic --save
```

#### 2. Create Configuration

```javascript
// newrelic.js (root directory)
'use strict';

exports.config = {
  app_name: ['Horizon-HCM'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
  distributed_tracing: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated',
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
  },
};
```

#### 3. Initialize in Application

```typescript
// src/main.ts (FIRST LINE)
require('newrelic');

import { NestFactory } from '@nestjs/core';
// ... rest of imports
```

#### 4. Set Environment Variables

```bash
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=Horizon-HCM
NEW_RELIC_LOG_LEVEL=info
```

### Setup: DataDog

#### 1. Install DataDog Agent

```bash
npm install dd-trace --save
```

#### 2. Initialize Tracer

```typescript
// src/tracer.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'horizon-hcm',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  logInjection: true,
  analytics: true,
});

export default tracer;
```

#### 3. Import in Main

```typescript
// src/main.ts (FIRST LINE)
import './tracer';

import { NestFactory } from '@nestjs/core';
// ... rest of imports
```

#### 4. Set Environment Variables

```bash
DD_API_KEY=your-api-key
DD_SITE=datadoghq.com
DD_SERVICE=horizon-hcm
DD_ENV=production
DD_VERSION=1.0.0
```

### Setup: Elastic APM

#### 1. Install Elastic APM Agent

```bash
npm install elastic-apm-node --save
```

#### 2. Create Configuration

```javascript
// elastic-apm.js
module.exports = {
  serviceName: 'horizon-hcm',
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  environment: process.env.NODE_ENV,
  captureBody: 'all',
  errorOnAbortedRequests: true,
  captureErrorLogStackTraces: 'always',
};
```

#### 3. Initialize in Application

```typescript
// src/main.ts (FIRST LINE)
const apm = require('elastic-apm-node').start(require('../elastic-apm'));

import { NestFactory } from '@nestjs/core';
// ... rest of imports
```

#### 4. Set Environment Variables

```bash
ELASTIC_APM_SERVER_URL=https://apm.example.com
ELASTIC_APM_SECRET_TOKEN=your-secret-token
ELASTIC_APM_SERVICE_NAME=horizon-hcm
```

### Custom Instrumentation

Add custom spans for important operations:

```typescript
// New Relic
const newrelic = require('newrelic');

async function processPayment(paymentId: string) {
  return newrelic.startSegment('processPayment', true, async () => {
    // Your payment processing logic
    return result;
  });
}

// DataDog
import tracer from './tracer';

async function processPayment(paymentId: string) {
  const span = tracer.startSpan('payment.process');
  span.setTag('payment.id', paymentId);
  
  try {
    // Your payment processing logic
    return result;
  } finally {
    span.finish();
  }
}

// Elastic APM
const apm = require('elastic-apm-node');

async function processPayment(paymentId: string) {
  const span = apm.startSpan('Process Payment');
  
  try {
    // Your payment processing logic
    return result;
  } finally {
    span?.end();
  }
}
```

---

## Log Aggregation

### Seq Setup

Horizon-HCM uses Seq for centralized logging.

#### 1. Install Seq

```bash
# Docker
docker run -d --name seq \
  -e ACCEPT_EULA=Y \
  -p 5341:80 \
  -v /path/to/data:/data \
  datalust/seq:latest
```

#### 2. Configure Application

```bash
# Environment variables
SEQ_SERVER_URL=http://localhost:5341
SEQ_API_KEY=your-api-key
```

#### 3. Logging Service

The `LoggerService` automatically sends logs to Seq:

```typescript
// Already configured in common/logger/logger.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as seq from 'seq-logging';

@Injectable()
export class LoggerService {
  private seqLogger: any;

  constructor(private config: ConfigService) {
    this.seqLogger = new seq.Logger({
      serverUrl: this.config.get('SEQ_SERVER_URL'),
      apiKey: this.config.get('SEQ_API_KEY'),
    });
  }

  log(message: string, context?: string) {
    this.seqLogger.emit({
      timestamp: new Date(),
      level: 'Information',
      messageTemplate: message,
      properties: { context },
    });
  }
}
```

#### 4. Query Logs

Access Seq UI at `http://localhost:5341` and use queries:

```
// Find errors in last hour
level = 'Error' and @Timestamp > Now() - 1h

// Find slow requests
responseTime > 1000

// Find specific user's actions
userId = 'user-123'

// Find by correlation ID
correlationId = 'abc-123'
```

---

## Metrics Collection

### Built-in Performance Metrics

Horizon-HCM automatically collects performance metrics via `PerformanceInterceptor`.

#### Metrics Stored

```sql
CREATE TABLE performance_metrics (
  id VARCHAR PRIMARY KEY,
  endpoint VARCHAR NOT NULL,
  response_time_ms INTEGER NOT NULL,
  database_queries INTEGER DEFAULT 0,
  database_time_ms INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  external_api_calls INTEGER DEFAULT 0,
  external_api_time_ms INTEGER DEFAULT 0,
  status_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Query Metrics

```sql
-- Average response time by endpoint
SELECT 
  endpoint,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as request_count
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint
ORDER BY avg_response_time DESC;

-- Slow requests (>1s)
SELECT *
FROM performance_metrics
WHERE response_time_ms > 1000
ORDER BY created_at DESC
LIMIT 100;

-- Cache hit rate
SELECT 
  SUM(cache_hits) as total_hits,
  SUM(cache_misses) as total_misses,
  ROUND(SUM(cache_hits)::numeric / NULLIF(SUM(cache_hits + cache_misses), 0) * 100, 2) as hit_rate
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Custom Metrics

Add custom metrics using the tracking functions:

```typescript
import { trackDatabaseQuery, trackCacheHit, trackExternalApiCall } from '../common/interceptors/performance.interceptor';

async function myHandler(request: any) {
  const startTime = Date.now();
  
  // Your database query
  const result = await this.prisma.items.findMany();
  trackDatabaseQuery(request, Date.now() - startTime);
  
  // Track cache hit
  trackCacheHit(request);
  
  // Track external API call
  const apiStartTime = Date.now();
  await fetch('https://api.example.com');
  trackExternalApiCall(request, Date.now() - apiStartTime);
  
  return result;
}
```

---

## Alerting Configuration

### Alert Rules

Configure alerts for critical metrics:

#### 1. High Error Rate

```yaml
# Alert when error rate > 5% in 5 minutes
alert: HighErrorRate
condition: error_rate > 0.05
duration: 5m
severity: critical
channels: [slack, pagerduty]
```

#### 2. Slow Response Time

```yaml
# Alert when p95 response time > 1s
alert: SlowResponseTime
condition: p95_response_time > 1000
duration: 10m
severity: warning
channels: [slack]
```

#### 3. Database Connection Pool

```yaml
# Alert when connection pool > 80%
alert: HighDatabaseConnections
condition: db_connections > 80
duration: 5m
severity: warning
channels: [slack]
```

#### 4. Memory Usage

```yaml
# Alert when memory > 90%
alert: HighMemoryUsage
condition: memory_usage > 0.90
duration: 5m
severity: critical
channels: [slack, pagerduty]
```

### Slack Integration

```typescript
// common/services/alert.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlertService {
  constructor(private config: ConfigService) {}

  async sendSlackAlert(message: string, severity: 'info' | 'warning' | 'critical') {
    const webhookUrl = this.config.get('SLACK_WEBHOOK_URL');
    
    const color = {
      info: '#36a64f',
      warning: '#ff9900',
      critical: '#ff0000',
    }[severity];

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `[${severity.toUpperCase()}] Horizon-HCM Alert`,
          text: message,
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
    });
  }
}
```

---

## Dashboard Setup

### Key Dashboards

#### 1. Application Overview

Metrics to display:
- Request rate (requests/minute)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

#### 2. Database Performance

Metrics to display:
- Query count
- Slow queries (>1s)
- Connection pool usage
- Database size

#### 3. Cache Performance

Metrics to display:
- Cache hit rate
- Cache memory usage
- Eviction rate
- Key count

#### 4. System Resources

Metrics to display:
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

### Grafana Dashboard (Example)

```json
{
  "dashboard": {
    "title": "Horizon-HCM Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Response Time (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
        }]
      }
    ]
  }
}
```

---

## Best Practices

### 1. Set Appropriate Log Levels

```typescript
// Development
LOG_LEVEL=debug

// Staging
LOG_LEVEL=info

// Production
LOG_LEVEL=warn
```

### 2. Use Correlation IDs

Always include correlation IDs in logs for request tracing:

```typescript
const correlationId = getCorrelationId();
logger.log(`Processing request ${correlationId}`);
```

### 3. Monitor Business Metrics

Track business-specific metrics:

```typescript
// Track user signups
metrics.increment('user.signup');

// Track payment processing
metrics.timing('payment.process', duration);

// Track feature usage
metrics.increment(`feature.${featureName}.used`);
```

### 4. Set Up Synthetic Monitoring

Create health check monitors:

```bash
# Ping health endpoint every minute
*/1 * * * * curl https://api.horizon-hcm.com/health
```

### 5. Review Metrics Regularly

- Daily: Check error rates and response times
- Weekly: Review slow queries and optimize
- Monthly: Analyze trends and capacity planning

---

## Additional Resources

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [New Relic Docs](https://docs.newrelic.com)
- [DataDog Docs](https://docs.datadoghq.com)
- [Elastic APM Docs](https://www.elastic.co/guide/en/apm)

---

**Remember**: You can't improve what you don't measure! 📊
