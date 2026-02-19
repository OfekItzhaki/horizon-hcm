# 🧪 Comprehensive Testing Guide - Horizon-HCM

## Overview
This guide provides a complete testing flow for all implemented infrastructure features. Follow this step-by-step to validate every component.

---

## 📋 Pre-Testing Checklist

### Environment Setup
- [ ] Docker Desktop is running
- [ ] Node.js v18+ installed
- [ ] PostgreSQL client installed (optional, for debugging)
- [ ] Postman or similar API client installed
- [ ] Browser with dev tools

### Configuration Files
- [ ] `.env` file configured for Full mode (AUTH_MODE=full)
- [ ] JWT keys generated in `certs/` folder
- [ ] Database URL configured
- [ ] Redis configured

**Current Configuration:** Full Mode (Standalone Authentication)

---

## 🚀 Phase 1: Infrastructure Startup

### Step 1.1: Start Docker Services
```bash
npm run dev:start
```

**Expected Output:**
```
✓ PostgreSQL is healthy
✓ Redis is healthy
✓ Seq is healthy
All services are ready!
```

**Verify:**
- [ ] PostgreSQL accessible at localhost:5432
- [ ] Redis accessible at localhost:6379
- [ ] Seq UI accessible at http://localhost:5341

**Troubleshooting:**
- If services fail to start: `docker-compose down -v && npm run dev:start`
- Check Docker logs: `docker-compose logs [service-name]`

---

### Step 1.2: Run Database Migrations
```bash
# Generate Prisma client
npm run prisma:generate

# Run app migrations
npm run prisma:migrate
```

**Expected Output:**
```
✓ Migrations applied successfully
✓ Prisma Client generated
```

**Verify:**
- [ ] No migration errors
- [ ] Database tables created
- [ ] Auth tables created (User, Session, Device, etc.)

---

### Step 1.3: Start Application
```bash
npm run start:dev
```

**Expected Output:**
```
[Bootstrap] Application is running on: http://localhost:3001
[Bootstrap] Swagger documentation: http://localhost:3001/api/docs
[CacheService] Redis Client Connected
[FcmProvider] FCM Provider initialized (or warning if not configured)
[ApnsProvider] APNS Provider initialized (or warning if not configured)
[WebPushProvider] Web Push Provider initialized (or warning if not configured)
```

**Verify:**
- [ ] Application starts without errors
- [ ] No TypeScript compilation errors
- [ ] All modules load successfully

---

## 🏥 Phase 2: Health Check Testing

### Test 2.1: Basic Health Check
```bash
curl http://localhost:3001/health
```

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-19T...",
  "uptime": 45,
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 12
    },
    "redis": {
      "status": "up",
      "responseTime": 3
    }
  }
}
```

**Verify:**
- [ ] Status is "healthy"
- [ ] Database status is "up"
- [ ] Redis status is "up"
- [ ] Response times are reasonable (<100ms)

---

### Test 2.2: Readiness Probe
```bash
curl http://localhost:3001/health/ready
```

**Expected Response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2024-02-19T...",
  "checks": { ... }
}
```

**Verify:**
- [ ] Status is "ready"
- [ ] All dependency checks pass

---

### Test 2.3: Liveness Probe
```bash
curl http://localhost:3001/health/live
```

**Expected Response (200 OK):**
```json
{
  "status": "alive",
  "timestamp": "2024-02-19T...",
  "uptime": 50
}
```

**Verify:**
- [ ] Status is "alive"
- [ ] Uptime is increasing

---

## 🔐 Phase 3: Authentication Testing (Full Mode)

### Test 3.1: User Registration
**Endpoint:** `POST /auth/register`

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@horizon-hcm.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "phoneNumber": "+1234567890"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "test@horizon-hcm.com",
  "name": "Test User",
  "emailVerified": false,
  "isActive": true,
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verify:**
- [ ] User created successfully
- [ ] Password is not returned
- [ ] JWT token returned
- [ ] User stored in local database

---

### Test 3.2: User Login
**Endpoint:** `POST /auth/login`

**Request:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@horizon-hcm.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "test@horizon-hcm.com",
    "name": "Test User"
  }
}
```

**Verify:**
- [ ] JWT token returned
- [ ] Token is valid (decode at jwt.io)
- [ ] User data returned
- [ ] Session created in Redis

**Save the access_token for subsequent tests!**

---

### Test 3.3: Get User Profile
**Endpoint:** `GET /auth/profile`

**Request:**
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "test@horizon-hcm.com",
  "name": "Test User",
  "emailVerified": false,
  "phoneNumber": "+1234567890"
}
```

**Verify:**
- [ ] Profile data returned
- [ ] Requires authentication (401 without token)
- [ ] Token verified using local public key

---

### Test 3.4: Device Management (Optional)
**Endpoint:** `GET /auth/devices`

**Request:**
```bash
curl -X GET http://localhost:3001/auth/devices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "devices": [
    {
      "id": "uuid",
      "deviceName": "Chrome on Windows",
      "lastUsed": "2024-02-19T...",
      "isCurrentDevice": true
    }
  ]
}
```

**Verify:**
- [ ] Current device listed
- [ ] Device fingerprint tracked

---

### Test 3.5: 2FA Setup (Optional)
**Endpoint:** `POST /auth/2fa/enable`

**Request:**
```bash
curl -X POST http://localhost:3001/auth/2fa/enable \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["12345678", "87654321", ...]
}
```

**Verify:**
- [ ] QR code generated
- [ ] Secret returned
- [ ] Backup codes provided

---

## 📊 Phase 4: Logging & Monitoring Testing

### Test 4.1: Correlation ID Tracking
**Action:** Make any API request

**Check Seq Logs:**
1. Open http://localhost:5341
2. Search for your request
3. Look for `correlationId` field

**Verify:**
- [ ] Every log entry has a correlationId
- [ ] Same correlationId across request/response logs
- [ ] Correlation ID in response headers: `X-Correlation-ID`

---

### Test 4.2: Performance Metrics
**Action:** Make several API requests

**Check Seq Logs:**
1. Filter by message: "Performance Metrics"
2. Examine the logged data

**Verify:**
- [ ] Response time logged
- [ ] Database query count logged
- [ ] Cache hit/miss rates logged
- [ ] Slow requests flagged (>1000ms)

---

### Test 4.3: Error Logging
**Action:** Make an invalid request (e.g., invalid building ID)

**Check Seq Logs:**
1. Filter by level: "error"
2. Examine error details

**Verify:**
- [ ] Error logged with stack trace
- [ ] Correlation ID present
- [ ] User context included
- [ ] Sensitive data redacted

---

## 🏗️ Phase 5: CQRS & Building Management Testing

### Test 5.1: Create Building (Command)
**Endpoint:** `POST /buildings`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request:**
```json
{
  "name": "Sunset Towers",
  "addressLine": "123 Main Street",
  "city": "Tel Aviv",
  "postalCode": "12345",
  "numUnits": 24
}
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Sunset Towers",
  "addressLine": "123 Main Street",
  "city": "Tel Aviv",
  "postalCode": "12345",
  "numUnits": 24,
  "createdAt": "2024-02-19T...",
  "updatedAt": "2024-02-19T..."
}
```

**Verify:**
- [ ] Building created
- [ ] All fields returned
- [ ] Timestamps present

**Save the building ID for subsequent tests!**

---

### Test 5.2: Get Building (Query)
**Endpoint:** `GET /buildings/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Sunset Towers",
  ...
}
```

**Verify:**
- [ ] Building data returned
- [ ] Data matches created building

---

## 🎯 Phase 6: API Optimization Testing

### Test 6.1: Field Filtering
**Endpoint:** `GET /buildings/{id}?fields=id,name,city`

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Sunset Towers",
  "city": "Tel Aviv"
}
```

**Verify:**
- [ ] Only requested fields returned
- [ ] Other fields excluded

---

### Test 6.2: Response Compression
**Request with compression:**
```bash
curl -H "Accept-Encoding: gzip" http://localhost:3001/buildings/{id}
```

**Verify:**
- [ ] Response header: `Content-Encoding: gzip`
- [ ] Response size smaller than uncompressed

---

### Test 6.3: ETag Support
**First Request:**
```bash
curl -i http://localhost:3001/buildings/{id}
```

**Note the ETag header:**
```
ETag: "abc123..."
```

**Second Request with If-None-Match:**
```bash
curl -i -H "If-None-Match: \"abc123...\"" http://localhost:3001/buildings/{id}
```

**Expected Response:**
```
HTTP/1.1 304 Not Modified
```

**Verify:**
- [ ] First request returns 200 with ETag
- [ ] Second request returns 304 (Not Modified)
- [ ] No body in 304 response

---

### Test 6.4: Pagination (Offset-based)
**Endpoint:** `GET /buildings?page=1&limit=5`

**Expected Response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 5,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Verify:**
- [ ] Correct number of items returned
- [ ] Pagination metadata accurate
- [ ] hasNext/hasPrev correct

---

### Test 6.5: API Versioning
**Endpoint:** `GET /api/v1/buildings/{id}`

**Verify:**
- [ ] Request works with /api/v1/ prefix
- [ ] Deprecation headers present (if v1 is deprecated)

---

## 💾 Phase 7: Caching Testing

### Test 7.1: Cache Miss (First Request)
**Action:** Get a building for the first time

**Check Seq Logs:**
- Look for "Performance Metrics"
- Check `cacheMisses: 1`

**Verify:**
- [ ] Cache miss logged
- [ ] Data fetched from database

---

### Test 7.2: Cache Hit (Second Request)
**Action:** Get the same building again immediately

**Check Seq Logs:**
- Look for "Performance Metrics"
- Check `cacheHits: 1`

**Verify:**
- [ ] Cache hit logged
- [ ] Faster response time
- [ ] No database query

---

### Test 7.3: Cache Invalidation
**Action:** Update the building, then fetch it

**Verify:**
- [ ] Updated data returned
- [ ] Cache was invalidated
- [ ] New data cached

---

## 🔔 Phase 8: Push Notification Testing

### Test 8.1: Queue Notification
**Endpoint:** `POST /notifications/send` (you'll need to create this endpoint)

**Request:**
```json
{
  "deviceToken": "test-device-token",
  "provider": "fcm",
  "payload": {
    "title": "Test Notification",
    "body": "This is a test",
    "data": { "testId": "123" }
  }
}
```

**Verify:**
- [ ] Notification queued successfully
- [ ] Job appears in BullMQ queue
- [ ] Check logs for processing

---

### Test 8.2: Silent Notification
**Request:**
```json
{
  "deviceToken": "test-device-token",
  "provider": "fcm",
  "payload": {
    "title": "",
    "body": "",
    "silent": true,
    "data": { "syncRequired": true }
  }
}
```

**Verify:**
- [ ] Silent notification queued
- [ ] No title/body in payload

---

## 🔒 Phase 9: Security Testing

### Test 9.1: Rate Limiting
**Action:** Make 101 requests rapidly to the same endpoint

**Expected:**
- First 100 requests: 200 OK
- 101st request: 429 Too Many Requests

**Response:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Verify:**
- [ ] Rate limit enforced
- [ ] Retry-After header present

---

### Test 9.2: Input Validation
**Action:** Send invalid data

**Request:**
```json
{
  "name": "",
  "numUnits": -5
}
```

**Expected Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "numUnits must be positive"],
  "error": "Bad Request"
}
```

**Verify:**
- [ ] Validation errors returned
- [ ] Descriptive error messages

---

### Test 9.3: Authentication Required
**Action:** Access protected endpoint without token

**Expected Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Verify:**
- [ ] 401 status code
- [ ] No sensitive data leaked

---

## 📈 Phase 10: Performance Testing

### Test 10.1: Response Time Baseline
**Action:** Make 10 requests to various endpoints

**Check Seq Logs:**
- Filter for "Performance Metrics"
- Note response times

**Verify:**
- [ ] Simple queries < 100ms
- [ ] Complex queries < 500ms
- [ ] Cached requests < 50ms

---

### Test 10.2: Database Query Optimization
**Action:** Make requests that trigger multiple queries

**Check Seq Logs:**
- Look for "High Database Query Count" warnings

**Verify:**
- [ ] Query count logged
- [ ] Warnings for >10 queries
- [ ] No N+1 query problems

---

### Test 10.3: Concurrent Requests
**Action:** Use a load testing tool (k6, artillery, or Postman runner)

**Test:**
- 100 concurrent users
- 1000 total requests
- Various endpoints

**Verify:**
- [ ] No errors under load
- [ ] Response times remain acceptable
- [ ] No memory leaks
- [ ] Connection pool handles load

---

## 🎨 Phase 11: Swagger Documentation Testing

### Test 11.1: Access Swagger UI
**URL:** http://localhost:3001/api/docs

**Verify:**
- [ ] Swagger UI loads
- [ ] All endpoints documented
- [ ] Request/response schemas visible
- [ ] Try it out feature works

---

### Test 11.2: Test Endpoints via Swagger
**Action:** Use "Try it out" for each endpoint

**Verify:**
- [ ] Authentication works (Authorize button)
- [ ] Requests execute successfully
- [ ] Responses match documentation

---

## 🔍 Phase 12: Seq Log Analysis

### Test 12.1: Log Structure
**Check Seq:** http://localhost:5341

**Verify:**
- [ ] Logs are structured JSON
- [ ] Consistent field naming
- [ ] Proper log levels (info, warn, error)
- [ ] Timestamps present

---

### Test 12.2: Log Filtering
**Try these filters in Seq:**
```
level = 'error'
correlationId = 'specific-id'
responseTime > 100
context = 'CreateBuildingHandler'
```

**Verify:**
- [ ] Filters work correctly
- [ ] Can trace requests by correlation ID
- [ ] Can find slow requests
- [ ] Can filter by context

---

## ✅ Final Verification Checklist

### Infrastructure
- [ ] All Docker services running
- [ ] Application starts without errors
- [ ] Health checks pass
- [ ] Swagger docs accessible

### Authentication
- [ ] User registration works
- [ ] Login returns JWT
- [ ] Protected endpoints require auth
- [ ] Profile retrieval works

### Logging & Monitoring
- [ ] Correlation IDs on all requests
- [ ] Performance metrics logged
- [ ] Errors logged with context
- [ ] Seq aggregation working

### API Features
- [ ] Field filtering works
- [ ] Pagination works (offset & cursor)
- [ ] Response compression works
- [ ] ETag support works
- [ ] API versioning works

### Caching
- [ ] Cache hits/misses logged
- [ ] Cache improves performance
- [ ] Cache invalidation works

### Security
- [ ] Rate limiting enforced
- [ ] Input validation works
- [ ] Authentication required
- [ ] Sensitive data redacted

### Performance
- [ ] Response times acceptable
- [ ] No slow query warnings
- [ ] Handles concurrent load
- [ ] No memory leaks

---

## 🐛 Troubleshooting Guide

### Application Won't Start
1. Check Docker services: `docker-compose ps`
2. Check logs: `docker-compose logs`
3. Verify .env configuration
4. Check for port conflicts

### Database Connection Errors
1. Verify DATABASE_URL in .env
2. Check PostgreSQL is running
3. Test connection: `docker-compose exec postgres psql -U postgres`
4. Run migrations again

### Redis Connection Errors
1. Verify REDIS_HOST and REDIS_PORT
2. Check Redis is running
3. Test connection: `docker-compose exec redis redis-cli ping`

### Authentication Errors
1. Verify JWT keys exist in certs/
2. Check AUTH_MODE setting
3. Verify auth service is running (if SSO mode)
4. Check token expiration

### Performance Issues
1. Check Seq for slow queries
2. Verify cache is working
3. Check database indexes
4. Monitor connection pool

---

## 📊 Success Criteria

**All tests pass when:**
- ✅ All health checks return 200
- ✅ Authentication flow works end-to-end
- ✅ CQRS commands and queries execute
- ✅ Logs appear in Seq with correlation IDs
- ✅ Response times < 200ms for simple queries
- ✅ Cache hit rate > 50% for repeated requests
- ✅ Rate limiting enforces limits
- ✅ No errors under normal load
- ✅ Swagger docs are complete and functional

---

## 📝 Test Results Template

```markdown
# Test Results - [Date]

## Environment
- Node Version: 
- Docker Version: 
- OS: 

## Test Summary
- Total Tests: 
- Passed: 
- Failed: 
- Skipped: 

## Failed Tests
1. [Test Name]
   - Expected: 
   - Actual: 
   - Error: 

## Performance Metrics
- Average Response Time: 
- P95 Response Time: 
- Cache Hit Rate: 
- Error Rate: 

## Notes
[Any observations or issues]
```

---

**Happy Testing! 🚀**
