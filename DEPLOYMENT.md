# Horizon-HCM Deployment Guide

## Overview

This guide covers deploying Horizon-HCM to production environments. The application is designed for cloud deployment with horizontal scaling capabilities.

## Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 14+ (or Supabase)
- Redis 6+
- Docker (optional, for containerized deployment)
- Cloud storage (AWS S3 or Azure Blob Storage)

## Environment Configuration

### Required Environment Variables

Create separate `.env` files for each environment:

#### Development (.env.development)
```env
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/horizon_hcm_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication (managed by @ofeklabs/horizon-auth)
AUTH_MODE=full
JWT_SECRET=your-dev-jwt-secret-min-32-chars
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-dev-access-key
AWS_SECRET_ACCESS_KEY=your-dev-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=horizon-hcm-dev

# Or Azure Blob Storage
# AZURE_STORAGE_CONNECTION_STRING=your-connection-string
# AZURE_STORAGE_CONTAINER=horizon-hcm-dev

# Notifications
FCM_SERVICE_ACCOUNT_PATH=./config/fcm-dev-service-account.json
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_KEY_PATH=./config/apns-dev-key.p8
APNS_PRODUCTION=false
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Logging
LOG_LEVEL=debug
SEQ_SERVER_URL=http://localhost:5341
SEQ_API_KEY=your-seq-api-key

# Cache
CACHE_NAMESPACE=horizon-hcm-dev
```

#### Staging (.env.staging)
```env
# Application
NODE_ENV=staging
PORT=3001
FRONTEND_URL=https://staging.horizon-hcm.com

# Database (use connection pooler for production)
DATABASE_URL=postgresql://user:password@staging-db.example.com:5432/horizon_hcm_staging

# Redis (use managed Redis service)
REDIS_HOST=staging-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Authentication
AUTH_MODE=full
JWT_SECRET=your-staging-jwt-secret-min-32-chars
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Storage
AWS_ACCESS_KEY_ID=your-staging-access-key
AWS_SECRET_ACCESS_KEY=your-staging-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=horizon-hcm-staging

# Notifications
FCM_SERVICE_ACCOUNT_PATH=./config/fcm-staging-service-account.json
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_KEY_PATH=./config/apns-staging-key.p8
APNS_PRODUCTION=false
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Logging
LOG_LEVEL=info
SEQ_SERVER_URL=https://staging-seq.example.com
SEQ_API_KEY=your-seq-api-key

# Cache
CACHE_NAMESPACE=horizon-hcm-staging
```

#### Production (.env.production)
```env
# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.horizon-hcm.com

# Database (use connection pooler)
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/horizon_hcm_prod

# Redis (use managed Redis service with clustering)
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Authentication
AUTH_MODE=full
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Storage
AWS_ACCESS_KEY_ID=your-prod-access-key
AWS_SECRET_ACCESS_KEY=your-prod-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=horizon-hcm-prod

# Notifications
FCM_SERVICE_ACCOUNT_PATH=./config/fcm-prod-service-account.json
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_KEY_PATH=./config/apns-prod-key.p8
APNS_PRODUCTION=true
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Logging
LOG_LEVEL=warn
SEQ_SERVER_URL=https://prod-seq.example.com
SEQ_API_KEY=your-seq-api-key

# Cache
CACHE_NAMESPACE=horizon-hcm-prod
```

## Database Setup

### 1. Run Migrations

```bash
# Development
npx prisma migrate dev

# Staging/Production
npx prisma migrate deploy
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Seed Database (Optional)

```bash
npm run seed
```

## Deployment Methods

### Method 1: Traditional Server Deployment

#### 1. Install Dependencies
```bash
npm ci --production
```

#### 2. Build Application
```bash
npm run build
```

#### 3. Run Migrations
```bash
npx prisma migrate deploy
```

#### 4. Start Application
```bash
npm run start:prod
```

#### 5. Use Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name horizon-hcm

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Method 2: Docker Deployment

#### 1. Build Docker Image
```bash
docker build -t horizon-hcm:latest .
```

#### 2. Run with Docker Compose
```bash
docker-compose up -d
```

#### Example docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    image: horizon-hcm:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

### Method 3: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

See `k8s/` directory for example manifests:
- `deployment.yaml` - Application deployment
- `service.yaml` - Service configuration
- `ingress.yaml` - Ingress rules
- `configmap.yaml` - Configuration
- `secrets.yaml` - Sensitive data

#### 2. Apply Manifests
```bash
kubectl apply -f k8s/
```

## Health Checks

The application provides health check endpoints for monitoring:

- **Liveness**: `GET /health/live` - Returns 200 if app is running
- **Readiness**: `GET /health/ready` - Returns 200 if app is ready to serve traffic
- **Health**: `GET /health` - Returns detailed health status

Configure your load balancer or orchestrator to use these endpoints.

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

1. **WebSocket Support**: Redis adapter enables WebSocket connections across multiple instances
2. **Session Management**: Sessions stored in Redis, not in-memory
3. **Job Queues**: BullMQ uses Redis for distributed job processing
4. **Caching**: Redis cache shared across all instances

### Vertical Scaling

Recommended minimum resources per instance:
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 10GB

For production:
- **CPU**: 4+ cores
- **RAM**: 4GB+
- **Storage**: 20GB+

## Monitoring

### Application Metrics

- **Performance Metrics**: Stored in database, accessible via `/analytics/performance/summary`
- **Error Rates**: Tracked per endpoint
- **Active Users**: Real-time tracking via `/analytics/users/active`

### Log Aggregation

Logs are sent to Seq for centralized monitoring:
- **URL**: Configure `SEQ_SERVER_URL` in environment
- **API Key**: Set `SEQ_API_KEY` for authentication
- **Log Level**: Adjust `LOG_LEVEL` per environment

### Alerting

Configure Seq alerts for:
- Error rate spikes
- Slow response times (>1000ms)
- High database query counts (>10 per request)
- Failed webhook deliveries
- Anomaly detection triggers

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secrets (min 32 characters)
- [ ] Enable CORS with specific origins
- [ ] Configure rate limiting
- [ ] Set up IP whitelisting for admin endpoints
- [ ] Use managed database with SSL
- [ ] Use managed Redis with authentication
- [ ] Store secrets in secure vault (AWS Secrets Manager, Azure Key Vault)
- [ ] Enable audit logging
- [ ] Configure firewall rules
- [ ] Set up DDoS protection
- [ ] Enable database backups
- [ ] Configure Redis persistence

## Backup & Recovery

### Database Backups

```bash
# Automated daily backups (configure in your database service)
# Or manual backup:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Redis Backups

```bash
# Redis automatically saves snapshots
# Configure in redis.conf:
save 900 1
save 300 10
save 60 10000
```

### File Storage Backups

- AWS S3: Enable versioning and lifecycle policies
- Azure Blob: Enable soft delete and versioning

## Rollback Procedure

### 1. Database Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### 2. Application Rollback
```bash
# With PM2
pm2 stop horizon-hcm
pm2 delete horizon-hcm
# Deploy previous version
pm2 start dist/main.js --name horizon-hcm

# With Docker
docker stop horizon-hcm
docker rm horizon-hcm
docker run -d --name horizon-hcm horizon-hcm:previous-version

# With Kubernetes
kubectl rollout undo deployment/horizon-hcm
```

## Troubleshooting

### Application Won't Start

1. Check environment variables are set correctly
2. Verify database connection: `npx prisma db pull`
3. Check Redis connection: `redis-cli ping`
4. Review logs: `pm2 logs horizon-hcm` or `kubectl logs <pod-name>`

### High Memory Usage

1. Check for memory leaks in logs
2. Increase instance memory
3. Scale horizontally instead of vertically
4. Review cache TTL settings

### Slow Response Times

1. Check database query performance
2. Review cache hit rates
3. Check Redis latency
4. Review performance metrics: `GET /analytics/performance/summary`

### WebSocket Connection Issues

1. Verify Redis adapter is configured
2. Check firewall allows WebSocket connections
3. Ensure load balancer supports WebSocket (sticky sessions)
4. Test SSE fallback: `GET /realtime/sse`

## Support

For deployment support:
- Documentation: http://localhost:3001/api/docs
- Email: devops@horizon-hcm.com
- Slack: #horizon-hcm-devops
