# Deployment Guide

## Overview

This guide covers deploying Horizon-HCM to production environments. The deployment process includes secrets management, database migrations, health checks, and rollback procedures.

## Prerequisites

### Required Software

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- PM2 (for process management)
- Git

### Optional Software

- AWS CLI (for AWS Secrets Manager)
- Docker (for containerized deployments)
- nginx (for reverse proxy)

### Required Secrets

Before deployment, ensure all required secrets are configured. See [SECRETS_QUICK_REFERENCE.md](./SECRETS_QUICK_REFERENCE.md) for the complete list.

**Minimum required:**
- `DATABASE_URL`
- `REDIS_HOST` and `REDIS_PORT`
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`

**Validate secrets before deployment:**

```bash
./scripts/validate-secrets.sh production
```

## Deployment Methods

### Method 1: Standard Deployment

Standard deployment with downtime (recommended for staging).

```bash
# 1. Validate secrets
./scripts/validate-secrets.sh production

# 2. Run deployment
./scripts/deploy.sh production

# 3. Verify deployment
curl http://localhost:3000/health
```

**What it does:**
1. Loads secrets from environment file or AWS Secrets Manager
2. Validates all required secrets are present
3. Checks database and Redis connectivity
4. Installs dependencies
5. Runs database migrations
6. Builds the application
7. Stops old application
8. Starts new application
9. Runs health checks
10. Saves PM2 configuration

### Method 2: Blue-Green Deployment

Zero-downtime deployment (recommended for production).

```bash
# 1. Validate secrets
./scripts/validate-secrets.sh production

# 2. Run blue-green deployment
./scripts/blue-green-deploy.sh production

# 3. Verify deployment
curl http://localhost:3000/health
```

**What it does:**
1. Loads secrets and validates
2. Determines current environment (blue or green)
3. Builds application
4. Runs database migrations
5. Starts new environment on different port
6. Runs health checks on new environment
7. Switches traffic to new environment
8. Waits for connections to drain
9. Stops old environment

**Benefits:**
- Zero downtime
- Quick rollback capability
- Safe deployment testing

### Method 3: CI/CD Deployment (GitHub Actions)

Automated deployment triggered by code push.

**Setup:**

1. **Add secrets to GitHub:**
   - Go to repository Settings → Secrets and variables → Actions
   - Add all required secrets (see SECRETS_MANAGEMENT.md)

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Monitor deployment:**
   - Go to Actions tab in GitHub
   - Watch deployment progress
   - Check logs for any errors

**GitHub Actions workflow** (already configured in `.github/workflows/deploy.yml`):
- Runs on push to main branch
- Executes tests
- Builds application
- Deploys to production
- Runs health checks

## Secrets Management

### Using Environment Files

**For development and staging:**

```bash
# 1. Create environment file
cp .env.example .env.production

# 2. Edit with production values
nano .env.production

# 3. Deploy
./scripts/deploy.sh production
```

### Using AWS Secrets Manager

**For production (recommended):**

```bash
# 1. Create secrets in AWS
aws secretsmanager create-secret \
    --name horizon-hcm/production/database \
    --secret-string '{"url":"postgresql://user:pass@host:5432/db"}'

# 2. Deploy with AWS Secrets Manager
export USE_AWS_SECRETS=true
export AWS_SECRETS_PREFIX=horizon-hcm/production
./scripts/deploy.sh production
```

### Using GitHub Secrets

**For CI/CD:**

Secrets are automatically injected from GitHub Secrets during CI/CD deployment.

**See:** [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for detailed instructions.

## Database Migrations

Database migrations are automatically run during deployment.

### Manual Migration

```bash
# Run migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

### Rollback Migration

Prisma doesn't support automatic rollback. For rollback:

1. **Identify the migration to rollback:**
   ```bash
   npx prisma migrate status
   ```

2. **Create rollback SQL manually:**
   ```sql
   -- Example: Rollback adding a column
   ALTER TABLE users DROP COLUMN new_column;
   ```

3. **Execute rollback SQL:**
   ```bash
   psql $DATABASE_URL -f rollback.sql
   ```

## Health Checks

### Automated Health Checks

Health checks are automatically run during deployment:

```bash
# Basic health check
curl http://localhost:3000/health

# Readiness check (includes dependency checks)
curl http://localhost:3000/health/ready
```

### Manual Health Checks

```bash
# Check application status
pm2 status horizon-hcm

# Check application logs
pm2 logs horizon-hcm --lines 50

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis connectivity
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

### Health Check Endpoints

**GET /health**
- Returns basic health status
- Response: `{ "status": "healthy", "uptime": 12345 }`

**GET /health/ready**
- Returns readiness status with dependency checks
- Checks: database, Redis, storage
- Response: `{ "status": "healthy", "checks": {...} }`

## Rollback

### Rollback to Previous Version

```bash
# 1. Identify version to rollback to
git tag -l

# 2. Run rollback script
./scripts/rollback.sh production v1.2.3

# 3. Verify rollback
curl http://localhost:3000/health
pm2 logs horizon-hcm --lines 50
```

### Quick Rollback (Blue-Green)

If using blue-green deployment, you can quickly switch back:

```bash
# Stop current environment
pm2 stop horizon-hcm-green

# Start previous environment
pm2 start horizon-hcm-blue

# Update load balancer to point to blue
```

## Monitoring

### Application Monitoring

```bash
# View application status
pm2 status

# View application logs
pm2 logs horizon-hcm

# View error logs only
pm2 logs horizon-hcm --err

# Monitor in real-time
pm2 monit
```

### Log Aggregation

Logs are sent to Seq for aggregation and analysis:

- **Seq URL**: Configured in `SEQ_SERVER_URL`
- **Access**: Open Seq dashboard to view logs
- **Alerts**: Configure alerts in Seq for critical errors

### Performance Monitoring

```bash
# View PM2 metrics
pm2 show horizon-hcm

# View memory usage
pm2 list

# Generate performance report
pm2 report
```

## Troubleshooting

### Deployment Fails

**Check secrets:**
```bash
./scripts/validate-secrets.sh production
```

**Check logs:**
```bash
pm2 logs horizon-hcm --lines 100
```

**Check database:**
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### Application Won't Start

**Check PM2 status:**
```bash
pm2 status
pm2 logs horizon-hcm --err
```

**Check port availability:**
```bash
netstat -an | grep 3000
```

**Check environment variables:**
```bash
pm2 env horizon-hcm
```

### Health Check Fails

**Check dependencies:**
```bash
# Database
psql $DATABASE_URL -c "SELECT 1;"

# Redis
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# Storage (S3)
aws s3 ls s3://$AWS_S3_BUCKET
```

**Check application logs:**
```bash
pm2 logs horizon-hcm --lines 50
```

### High Memory Usage

**Restart application:**
```bash
pm2 restart horizon-hcm
```

**Adjust memory limit:**
```bash
pm2 start dist/main.js --name horizon-hcm --max-memory-restart 1G
```

### Database Connection Issues

**Check connection string:**
```bash
echo $DATABASE_URL
```

**Test connection:**
```bash
psql $DATABASE_URL -c "SELECT version();"
```

**Check connection pool:**
```bash
# View active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'horizon_hcm';"
```

## Best Practices

### Pre-Deployment

- [ ] Run tests locally: `npm test`
- [ ] Validate secrets: `./scripts/validate-secrets.sh production`
- [ ] Review database migrations: `npx prisma migrate status`
- [ ] Check for breaking changes in CHANGELOG.md
- [ ] Notify team about deployment window

### During Deployment

- [ ] Monitor deployment logs
- [ ] Watch health check results
- [ ] Check error rates in Seq
- [ ] Verify critical features work
- [ ] Monitor performance metrics

### Post-Deployment

- [ ] Verify all health checks pass
- [ ] Test critical user flows
- [ ] Monitor error rates for 30 minutes
- [ ] Check database query performance
- [ ] Review application logs
- [ ] Update deployment log

### Deployment Schedule

**Recommended deployment windows:**
- **Staging**: Anytime
- **Production**: Off-peak hours (e.g., 2 AM - 4 AM local time)
- **Emergency fixes**: As needed with proper communication

## Security Considerations

### Secrets Security

- Never commit secrets to version control
- Use AWS Secrets Manager for production
- Rotate secrets regularly (see SECRETS_ROTATION.md)
- Restrict access to secrets using IAM policies

### Network Security

- Use HTTPS for all API communications
- Enable database SSL connections
- Configure firewall rules
- Use VPC for AWS resources

### Application Security

- Keep dependencies updated
- Run security audits: `npm audit`
- Enable rate limiting
- Configure CORS properly
- Use Helmet for security headers

## Scaling

### Horizontal Scaling

```bash
# Increase number of instances
pm2 scale horizon-hcm 4

# Or restart with more instances
pm2 delete horizon-hcm
pm2 start dist/main.js --name horizon-hcm --instances 4
```

### Load Balancing

Configure nginx as reverse proxy:

```nginx
upstream horizon_hcm {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name api.horizon-hcm.com;

    location / {
        proxy_pass http://horizon_hcm;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## References

- [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) - Comprehensive secrets guide
- [SECRETS_QUICK_REFERENCE.md](./SECRETS_QUICK_REFERENCE.md) - Quick reference
- [SECRETS_ROTATION.md](./SECRETS_ROTATION.md) - Rotation procedures
- [.env.example](../.env.example) - Environment variables template

## Support

For deployment issues:
1. Check this guide and related documentation
2. Review application logs: `pm2 logs horizon-hcm`
3. Check Seq dashboard for errors
4. Contact DevOps team
