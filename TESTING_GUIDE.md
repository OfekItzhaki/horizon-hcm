# 🧪 Horizon-HCM Testing Guide

## ✅ You Can Now Test!

The CQRS + Horizon Standard architecture is fully set up and ready for testing.

## 🚀 Quick Start Testing

### 1. Start the Infrastructure

```bash
# Start PostgreSQL, Redis, and Seq
npm run dev:start
```

Wait for all services to be healthy (the script will confirm).

### 2. Run Database Migrations

```bash
# Auth package migrations
npx prisma migrate deploy --schema=./node_modules/@ofeklabs/horizon-auth/prisma/schema.prisma

# Horizon-HCM migrations
npm run prisma:migrate
```

### 3. Start the Application

```bash
npm run start:dev
```

### 4. Access the Application

- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs ⭐ **Start here!**
- **Seq Logs**: http://localhost:5341

## 📚 What to Test

### 1. Authentication Flow (Using Your Package)

Open Swagger at http://localhost:3001/api/docs

**Test Registration:**
```bash
POST /auth/register
{
  "email": "test@horizon-hcm.com",
  "password": "SecurePass123!",
  "name": "Test User"
}
```

**Test Login:**
```bash
POST /auth/login
{
  "email": "test@horizon-hcm.com",
  "password": "SecurePass123!"
}
```

Copy the `access_token` from the response.

**Test 2FA:**
```bash
POST /auth/2fa/enable
Authorization: Bearer YOUR_TOKEN_HERE
```

**Test Device Management:**
```bash
GET /auth/devices
Authorization: Bearer YOUR_TOKEN_HERE
```

### 2. Building Management (CQRS Example)

**Create a Building (CQRS Command):**
```bash
POST /buildings
Authorization: Bearer YOUR_TOKEN_HERE
{
  "name": "Sunset Towers",
  "addressLine": "123 Main Street",
  "city": "Tel Aviv",
  "postalCode": "12345",
  "numUnits": 24
}
```

**Get Building (CQRS Query):**
```bash
GET /buildings/{id}
Authorization: Bearer YOUR_TOKEN_HERE
```

### 3. Check Structured Logs

Open Seq at http://localhost:5341

You'll see:
- ✅ All HTTP requests with timing
- ✅ Command executions (CreateBuildingCommand)
- ✅ Query executions (GetBuildingQuery)
- ✅ Error traces
- ✅ Contextual metadata

Filter by:
- `level = 'error'` - See only errors
- `context = 'CreateBuildingHandler'` - See specific handler logs
- `responseTime > 100` - See slow requests

## 🎯 Testing Checklist

### ✅ Infrastructure
- [ ] PostgreSQL is running (port 5432)
- [ ] Redis is running (port 6379)
- [ ] Seq is running (port 5341)
- [ ] Application starts without errors

### ✅ Authentication (@ofeklabs/horizon-auth)
- [ ] User registration works
- [ ] Email/password login works
- [ ] JWT token is returned
- [ ] 2FA can be enabled
- [ ] Device management works
- [ ] Push token registration works

### ✅ CQRS Architecture
- [ ] Commands execute (POST /buildings)
- [ ] Queries execute (GET /buildings/:id)
- [ ] Handlers log execution
- [ ] Database operations work

### ✅ Observability
- [ ] Logs appear in console (colorized)
- [ ] Logs appear in Seq (structured JSON)
- [ ] Request/response times are logged
- [ ] Errors are logged with stack traces
- [ ] Sensitive data is redacted (passwords, tokens)

### ✅ Security
- [ ] Security headers are set (check browser dev tools)
- [ ] Rate limiting works (try 100+ requests)
- [ ] CORS is configured
- [ ] Input validation works (try invalid data)

### ✅ API Documentation
- [ ] Swagger UI loads at /api/docs
- [ ] All endpoints are documented
- [ ] Try it out feature works
- [ ] Bearer auth works in Swagger

## 🔍 Testing Scenarios

### Scenario 1: Complete User Journey

1. Register a new user
2. Login and get JWT token
3. Enable 2FA
4. Create a building
5. Get the building details
6. Check logs in Seq

### Scenario 2: Error Handling

1. Try to create building without auth → 401 Unauthorized
2. Try to create building with invalid data → 400 Bad Request
3. Try to get non-existent building → 404 Not Found
4. Check error logs in Seq

### Scenario 3: Performance Testing

1. Create 10 buildings rapidly
2. Check response times in Seq
3. Verify all under 200ms (simple operations)
4. Check database connection pooling

### Scenario 4: Security Testing

1. Try SQL injection in building name
2. Try XSS payload in address
3. Verify input sanitization works
4. Check security headers in response

## 📊 What's Working

### ✅ Implemented Features

**Architecture:**
- ✅ CQRS pattern (Commands & Queries)
- ✅ Clean Architecture layers
- ✅ Dependency Injection
- ✅ Global exception handling

**Authentication:**
- ✅ User registration & login
- ✅ JWT with RSA keys
- ✅ 2FA support
- ✅ Device management
- ✅ Push notification tokens
- ✅ Account management

**Observability:**
- ✅ Structured logging (Winston)
- ✅ Log aggregation (Seq)
- ✅ Request/response logging
- ✅ Performance tracking
- ✅ Error tracking

**Security:**
- ✅ Helmet.js security headers
- ✅ Rate limiting (100 req/min)
- ✅ Input validation
- ✅ CORS configuration
- ✅ Sensitive data redaction

**Developer Experience:**
- ✅ Swagger/OpenAPI docs
- ✅ Docker Compose setup
- ✅ Pre-commit hooks (Husky)
- ✅ Automated setup scripts
- ✅ Hot reload in development

**Example Module:**
- ✅ Building Management (CQRS)
  - Create Building (Command)
  - Get Building (Query)

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker --version

# Check service status
docker-compose ps

# View service logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs seq
```

### Database Connection Error

```bash
# Check DATABASE_URL in .env
# Make sure PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -d horizon_hcm
```

### Redis Connection Error

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Application Won't Start

```bash
# Check for build errors
npm run build

# Check for linting errors
npm run lint

# Check logs
# Look in logs/ directory or Seq
```

## 📈 Next Steps

After testing the current implementation:

1. **Add More CQRS Modules:**
   - Apartment Management
   - Payment System
   - Announcements

2. **Add Background Jobs:**
   - Email sending (BullMQ)
   - Invoice generation
   - Notification delivery

3. **Add Real-time Features:**
   - Socket.IO for live updates
   - Real-time notifications
   - Chat system

4. **Add Tests:**
   - Unit tests for handlers
   - Integration tests for endpoints
   - E2E tests for user journeys

5. **Mobile App Development:**
   - React Native app
   - API client generation from Swagger
   - Push notifications integration

## 🎉 Success Criteria

You'll know everything is working when:

- ✅ All services start without errors
- ✅ Swagger docs load and are interactive
- ✅ You can register and login
- ✅ You can create and retrieve buildings
- ✅ Logs appear in Seq with full context
- ✅ Response times are under 200ms
- ✅ Security headers are present
- ✅ Rate limiting works

---

**Happy Testing! 🚀**

If you encounter any issues, check:
1. Docker services are running
2. Environment variables are set
3. Migrations have been applied
4. Logs in Seq for detailed errors
