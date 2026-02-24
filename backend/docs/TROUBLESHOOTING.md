# Troubleshooting Guide

**Last Updated**: 2026-02-24  
**Version**: 1.0

Common issues and solutions for Horizon-HCM.

---

## Table of Contents

1. [Database Issues](#database-issues)
2. [Redis Issues](#redis-issues)
3. [Authentication Problems](#authentication-problems)
4. [Performance Issues](#performance-issues)
5. [Common Error Messages](#common-error-messages)
6. [Debugging Tips](#debugging-tips)

---

## Database Issues

### Issue: Cannot connect to database

**Symptoms:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**

1. **Check if PostgreSQL is running**
   ```bash
   # Check status
   pg_isready -h localhost -p 5432
   
   # Start PostgreSQL (if using local)
   sudo service postgresql start
   ```

2. **Verify DATABASE_URL**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:5432/database
   ```

3. **Check network connectivity**
   ```bash
   telnet localhost 5432
   ```

4. **Verify credentials**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Issue: Migration fails

**Symptoms:**
```
Error: Migration failed to apply cleanly to the shadow database
```

**Solutions:**

1. **Check migration status**
   ```bash
   npx prisma migrate status
   ```

2. **Reset shadow database**
   ```bash
   npx prisma migrate reset --skip-seed
   ```

3. **Apply migrations manually**
   ```bash
   npx prisma migrate deploy
   ```

4. **If all else fails, restore from backup**
   ```bash
   ./scripts/restore-database.sh backup.sql
   ```

### Issue: Slow queries

**Symptoms:**
- Response times > 1 second
- High database CPU usage

**Solutions:**

1. **Check slow query log**
   ```sql
   SELECT query, calls, mean_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Add missing indexes**
   ```sql
   -- Example: Add index on frequently queried column
   CREATE INDEX idx_apartments_building_id ON apartments(building_id);
   ```

3. **Analyze query plan**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM apartments WHERE building_id = 'xxx';
   ```

---

## Redis Issues

### Issue: Cannot connect to Redis

**Symptoms:**
```
Error: Redis connection to localhost:6379 failed
```

**Solutions:**

1. **Check if Redis is running**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Start Redis**
   ```bash
   # Linux/Mac
   redis-server
   
   # Windows
   redis-server.exe
   ```

3. **Verify Redis configuration**
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

### Issue: High memory usage

**Symptoms:**
- Redis using > 80% of available memory
- Eviction warnings in logs

**Solutions:**

1. **Check memory usage**
   ```bash
   redis-cli INFO memory
   ```

2. **Clear cache**
   ```bash
   redis-cli FLUSHDB
   ```

3. **Adjust maxmemory policy**
   ```bash
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

---

## Authentication Problems

### Issue: Firebase token validation fails

**Symptoms:**
```
Error: Firebase ID token has expired
```

**Solutions:**

1. **Verify Firebase configuration**
   ```bash
   echo $FIREBASE_PROJECT_ID
   echo $FIREBASE_CLIENT_EMAIL
   ```

2. **Check service account key**
   ```bash
   cat firebase-service-account.json | jq .project_id
   ```

3. **Refresh token on client side**
   ```typescript
   const token = await user.getIdToken(true); // Force refresh
   ```

### Issue: Unauthorized access

**Symptoms:**
```
403 Forbidden: Access denied: Committee member role required
```

**Solutions:**

1. **Verify user has correct role**
   ```sql
   SELECT * FROM building_committee_members 
   WHERE user_id = 'xxx' AND building_id = 'yyy';
   ```

2. **Clear cache**
   ```bash
   redis-cli DEL "committee:user-id:building-id"
   ```

3. **Check guard logic**
   - Review `CommitteeMemberGuard` implementation
   - Verify `buildingId` extraction from request

---

## Performance Issues

### Issue: Slow response times

**Symptoms:**
- API responses > 500ms
- Timeout errors

**Solutions:**

1. **Check performance metrics**
   ```sql
   SELECT endpoint, AVG(response_time_ms) as avg_time
   FROM performance_metrics
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY endpoint
   ORDER BY avg_time DESC;
   ```

2. **Enable caching**
   ```typescript
   @Cacheable({ key: 'resource:{{id}}', ttl: 300 })
   async getResource(id: string) { }
   ```

3. **Optimize database queries**
   - Add indexes
   - Use select specific fields
   - Implement pagination

4. **Check for N+1 queries**
   ```typescript
   // Bad: N+1 query
   const apartments = await prisma.apartments.findMany();
   for (const apt of apartments) {
     const owners = await prisma.apartment_owners.findMany({ 
       where: { apartment_id: apt.id } 
     });
   }
   
   // Good: Single query with include
   const apartments = await prisma.apartments.findMany({
     include: { apartment_owners: true }
   });
   ```

### Issue: High memory usage

**Symptoms:**
- Application crashes with OOM
- Memory usage > 90%

**Solutions:**

1. **Check memory usage**
   ```bash
   pm2 monit
   ```

2. **Increase Node.js memory limit**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

3. **Find memory leaks**
   ```bash
   node --inspect src/main.ts
   # Use Chrome DevTools to profile
   ```

---

## Common Error Messages

### "Apartment already exists"

**Error:**
```
BadRequestException: Apartment 12A already exists in this building
```

**Solution:**
- Check if apartment number is truly unique
- Verify building ID is correct
- Use different apartment number

### "Total ownership shares exceed 100%"

**Error:**
```
BadRequestException: Total ownership shares would exceed 100%
```

**Solution:**
- Calculate current total shares
- Adjust new owner's share
- Remove or update existing owners

### "Feature not enabled"

**Error:**
```
ForbiddenException: Feature 'new-dashboard' is not enabled for this user
```

**Solution:**
```sql
-- Enable feature for user
UPDATE feature_flags SET is_enabled = true WHERE name = 'new-dashboard';

-- Or enable for specific user
INSERT INTO feature_flag_assignments (feature_flag_id, user_id, variant)
VALUES ('flag-id', 'user-id', 'enabled');
```

---

## Debugging Tips

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug npm start
```

### Check Application Logs

```bash
# View logs
pm2 logs horizon-hcm

# View error logs only
tail -f logs/error-*.log

# Search logs
grep "ERROR" logs/application-*.log
```

### Use Correlation IDs

Every request has a correlation ID for tracing:

```bash
# Find all logs for a specific request
grep "correlation-id-here" logs/*.log
```

### Database Query Logging

Enable Prisma query logging:

```typescript
// prisma/prisma.service.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Redis Monitoring

```bash
# Monitor Redis commands in real-time
redis-cli MONITOR

# Check cache hit rate
redis-cli INFO stats | grep keyspace
```

---

## Getting Help

If you can't resolve the issue:

1. **Check logs** for detailed error messages
2. **Search documentation** for similar issues
3. **Ask team** in #horizon-hcm-support Slack channel
4. **Create ticket** with:
   - Error message
   - Steps to reproduce
   - Environment (dev/staging/prod)
   - Correlation ID
   - Relevant logs

---

## Additional Resources

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
