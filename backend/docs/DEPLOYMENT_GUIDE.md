# Deployment Guide

**Last Updated**: 2026-02-24  
**Version**: 1.0  
**Status**: Production Ready

This guide covers deployment procedures, environment setup, and operational tasks for Horizon-HCM.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Database Migrations](#database-migrations)
3. [Deployment Strategies](#deployment-strategies)
4. [Blue-Green Deployment](#blue-green-deployment)
5. [Rollback Procedures](#rollback-procedures)
6. [Health Checks](#health-checks)
7. [Database Backup Strategy](#database-backup-strategy)
8. [Monitoring and Alerts](#monitoring-and-alerts)

---

## Environment Setup

### Environments

Horizon-HCM supports three environments:

- **Development**: Local development and testing
- **Staging**: Pre-production testing and QA
- **Production**: Live production environment

### Environment Variables

Each environment requires these variables:

```bash
# Application
NODE_ENV=production
PORT=3001
APP_URL=https://api.horizon-hcm.com

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_NAMESPACE=horizon-hcm

# Firebase Authentication
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Logging
SEQ_SERVER_URL=http://seq.example.com
SEQ_API_KEY=your-seq-api-key

# Security
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key

# Rate Limiting
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=1000

# Feature Flags
FEATURE_FLAGS_ENABLED=true

# File Storage
STORAGE_BUCKET=horizon-hcm-files
STORAGE_REGION=us-east-1

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@horizon-hcm.com
SMTP_PASSWORD=your-smtp-password
```

### Environment-Specific Configurations

**Development (.env.development)**
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/horizon_dev
REDIS_HOST=localhost
LOG_LEVEL=debug
```

**Staging (.env.staging)**
```bash
NODE_ENV=staging
PORT=3001
DATABASE_URL=postgresql://staging-db:5432/horizon_staging
REDIS_HOST=staging-redis
LOG_LEVEL=info
```

**Production (.env.production)**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prod-db:5432/horizon_prod
REDIS_HOST=prod-redis
LOG_LEVEL=warn
```

---

## Database Migrations

### Running Migrations

Migrations are managed by Prisma and should be run before deploying new code.

#### Development

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_new_feature

# Apply migrations
npx prisma migrate dev
```

#### Staging/Production

```bash
# Deploy migrations (no prompts)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Migration Best Practices

1. **Test migrations in staging first**
2. **Backup database before running migrations**
3. **Run migrations during low-traffic periods**
4. **Have rollback plan ready**
5. **Monitor application after migration**

### Migration Rollback

If a migration fails:

```bash
# 1. Restore database from backup
./scripts/restore-database.sh backup-2024-02-24.sql

# 2. Revert code to previous version
git checkout previous-tag

# 3. Redeploy application
npm run deploy
```

---

## Deployment Strategies

### Standard Deployment

For small updates with minimal risk:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci

# 3. Run migrations
npx prisma migrate deploy

# 4. Build application
npm run build

# 5. Restart application
pm2 restart horizon-hcm
```

### Zero-Downtime Deployment

For production deployments:

```bash
# Use the deployment script
./scripts/deploy.sh production
```

This script:
1. Builds the application
2. Runs database migrations
3. Performs health checks
4. Gradually shifts traffic to new version
5. Monitors for errors
6. Rolls back if issues detected

---

## Blue-Green Deployment

Blue-green deployment eliminates downtime by running two identical environments.

### Architecture

```
Load Balancer
    ├── Blue Environment (Current Production)
    └── Green Environment (New Version)
```

### Deployment Process

```bash
# Run the blue-green deployment script
./scripts/blue-green-deploy.sh
```

#### Step-by-Step Process

1. **Prepare Green Environment**
   ```bash
   # Deploy new version to green environment
   ssh green-server
   git pull origin main
   npm ci
   npm run build
   ```

2. **Run Migrations**
   ```bash
   # Run migrations on shared database
   npx prisma migrate deploy
   ```

3. **Health Check Green**
   ```bash
   # Verify green environment is healthy
   curl http://green-server:3001/health
   ```

4. **Switch Traffic**
   ```bash
   # Update load balancer to point to green
   # This is instant - no downtime
   aws elb modify-target-group --target-group-arn $GREEN_TG
   ```

5. **Monitor**
   ```bash
   # Watch logs and metrics for 10 minutes
   # If issues detected, switch back to blue
   ```

6. **Decommission Blue**
   ```bash
   # After 24 hours of stable operation
   # Blue becomes the new green for next deployment
   ```

### Rollback

Instant rollback by switching load balancer back to blue:

```bash
aws elb modify-target-group --target-group-arn $BLUE_TG
```

---

## Rollback Procedures

### Application Rollback

```bash
# Use the rollback script
./scripts/rollback.sh

# Or manually:
# 1. Checkout previous version
git checkout v1.2.3

# 2. Install dependencies
npm ci

# 3. Build
npm run build

# 4. Restart
pm2 restart horizon-hcm
```

### Database Rollback

```bash
# 1. Stop application
pm2 stop horizon-hcm

# 2. Restore database
./scripts/restore-database.sh backup-2024-02-24.sql

# 3. Checkout matching code version
git checkout v1.2.3

# 4. Restart application
pm2 start horizon-hcm
```

### Rollback Checklist

- [ ] Identify the issue and root cause
- [ ] Determine rollback target version
- [ ] Notify team of rollback
- [ ] Stop application
- [ ] Restore database if needed
- [ ] Deploy previous version
- [ ] Verify health checks
- [ ] Monitor for 30 minutes
- [ ] Document incident

---

## Health Checks

### Health Check Endpoint

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-24T10:30:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected",
  "memory": {
    "used": 512,
    "total": 2048
  }
}
```

### Readiness Check

```
GET /health/ready
```

Returns 200 if application is ready to serve traffic.

### Liveness Check

```
GET /health/live
```

Returns 200 if application is alive (used by orchestrators).

### Monitoring Health

```bash
# Check health
curl http://localhost:3001/health

# Continuous monitoring
watch -n 5 'curl -s http://localhost:3001/health | jq'
```

---

## Database Backup Strategy

### Automated Backups

#### Daily Backups

Automated daily backups run at 2 AM UTC:

```bash
# Cron job (runs daily at 2 AM)
0 2 * * * /app/scripts/backup-database.sh
```

#### Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="$BACKUP_DIR/horizon-hcm-$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://horizon-hcm-backups/

# Keep only last 30 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Backup Retention Policy

- **Daily backups**: Retained for 30 days
- **Weekly backups**: Retained for 90 days (every Sunday)
- **Monthly backups**: Retained for 1 year (first of month)
- **Yearly backups**: Retained indefinitely

### Manual Backup

```bash
# Create manual backup
./scripts/backup-database.sh

# Backup specific database
pg_dump -h localhost -U postgres -d horizon_prod > backup.sql
```

### Restore from Backup

```bash
# Restore from backup file
./scripts/restore-database.sh backup-2024-02-24.sql

# Or manually:
psql $DATABASE_URL < backup-2024-02-24.sql
```

### Backup Verification

Test backups monthly:

```bash
# 1. Restore to test database
psql $TEST_DATABASE_URL < backup.sql

# 2. Run integrity checks
npm run test:integration

# 3. Verify data completeness
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM apartments;"
```

### Disaster Recovery

In case of complete database loss:

1. **Identify latest valid backup**
   ```bash
   aws s3 ls s3://horizon-hcm-backups/ | tail -10
   ```

2. **Download backup**
   ```bash
   aws s3 cp s3://horizon-hcm-backups/backup-2024-02-24.sql.gz .
   gunzip backup-2024-02-24.sql.gz
   ```

3. **Restore database**
   ```bash
   psql $DATABASE_URL < backup-2024-02-24.sql
   ```

4. **Verify restoration**
   ```bash
   npm run test:integration
   ```

5. **Resume operations**
   ```bash
   pm2 start horizon-hcm
   ```

**Recovery Time Objective (RTO)**: 1 hour  
**Recovery Point Objective (RPO)**: 24 hours (daily backups)

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Application Health**
   - Response time (p50, p95, p99)
   - Error rate
   - Request throughput
   - Active connections

2. **Database**
   - Connection pool usage
   - Query performance
   - Slow queries (>1s)
   - Database size

3. **Redis**
   - Memory usage
   - Cache hit rate
   - Eviction rate
   - Connection count

4. **System Resources**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time (p95) | >500ms | >1000ms |
| Error Rate | >1% | >5% |
| CPU Usage | >70% | >90% |
| Memory Usage | >80% | >95% |
| Disk Space | >80% | >90% |
| Database Connections | >80% | >95% |

### Alert Channels

- **Slack**: #horizon-hcm-alerts
- **Email**: ops@horizon-hcm.com
- **PagerDuty**: For critical alerts

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Database migrations tested in staging
- [ ] Backup created
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] Rollback plan prepared

### During Deployment

- [ ] Run database migrations
- [ ] Deploy new version
- [ ] Verify health checks
- [ ] Check error logs
- [ ] Monitor key metrics
- [ ] Test critical user flows

### Post-Deployment

- [ ] Monitor for 30 minutes
- [ ] Verify no error spikes
- [ ] Check performance metrics
- [ ] Test critical features
- [ ] Update deployment log
- [ ] Notify team of completion

---

## Troubleshooting Deployments

### Common Issues

**Issue**: Migration fails
```bash
# Solution: Rollback and investigate
./scripts/rollback.sh
npx prisma migrate status
```

**Issue**: Application won't start
```bash
# Check logs
pm2 logs horizon-hcm

# Check environment variables
printenv | grep DATABASE_URL

# Verify database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Issue**: High error rate after deployment
```bash
# Immediate rollback
./scripts/rollback.sh

# Investigate logs
tail -f logs/error-*.log
```

---

## Additional Resources

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) - Monitoring setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [Database Backup Scripts](../scripts/) - Backup automation scripts

---

## Support

For deployment issues:
- **Slack**: #horizon-hcm-ops
- **Email**: ops@horizon-hcm.com
- **On-Call**: Check PagerDuty schedule

---

**Remember**: Always test in staging first! 🚀
