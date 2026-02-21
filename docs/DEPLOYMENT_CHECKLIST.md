# Horizon-HCM Deployment Checklist

## Current Status

### ✅ Completed
- [x] Dependencies installed (`npm install --legacy-peer-deps`)
- [x] Prisma client generated (`npm run prisma:generate`)
- [x] Database connection configured (Supabase PostgreSQL)
- [x] All code implemented and pushed to GitHub
- [x] No syntax errors in codebase

### ⚠️ Pending
- [ ] Redis setup and configuration
- [ ] Database migrations run
- [ ] Environment variables verified
- [ ] Tests passing
- [ ] Application builds successfully

---

## 1. Redis Setup (Required)

### Why Redis is Needed
Redis is used for:
- Session management (@ofeklabs/horizon-auth)
- Authorization guard caching (15-minute TTL)
- Report caching (5-10 minute TTL)
- Real-time features (Socket.IO adapter)

### Installation Options

#### Option A: Local Redis (Development)
**Windows:**
```powershell
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
# Install and start as Windows service
```

**Verify Installation:**
```powershell
redis-cli ping
# Should return: PONG
```

#### Option B: Docker Redis (Recommended)
```powershell
# Pull and run Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Verify
docker ps
docker exec -it redis redis-cli ping
```

#### Option C: Cloud Redis (Production)
- **Upstash**: https://upstash.com/ (Free tier available)
- **Redis Cloud**: https://redis.com/try-free/
- **AWS ElastiCache**: For production deployments

### Configuration
Update `.env.development`:
```env
REDIS_HOST="localhost"  # or cloud Redis host
REDIS_PORT=6379
```

---

## 2. Database Migrations

### Check Current Migration Status
```powershell
npm run prisma:migrate status
```

### Run Migrations
```powershell
# Development
npm run prisma:migrate dev

# Production
npm run prisma:migrate deploy
```

### Verify Database
```powershell
# Open Prisma Studio to inspect database
npm run prisma:studio
```

---

## 3. Environment Variables Verification

### Required Variables (`.env.development`)

#### ✅ Already Configured
- `DATABASE_URL` - Supabase PostgreSQL connection
- `AUTH_MODE=full`
- `PORT=3001`
- `NODE_ENV=development`

#### ⚠️ Need Verification
- `REDIS_HOST` and `REDIS_PORT` - After Redis setup
- `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH` - Check if certs exist

#### 🔧 Optional (Can Skip for Now)
- AWS S3 credentials (file storage will fail without these)
- Push notification credentials (FCM, APNS, VAPID)
- Email SMTP settings

### Check JWT Keys
```powershell
# Check if JWT keys exist
Test-Path ./certs/private.pem
Test-Path ./certs/public.pem

# If missing, generate them:
npm run setup
# Or manually generate:
# openssl genrsa -out certs/private.pem 2048
# openssl rsa -in certs/private.pem -pubout -out certs/public.pem
```

---

## 4. Build Application

### TypeScript Compilation
```powershell
npm run build
```

### Expected Output
- Compiled files in `dist/` directory
- No TypeScript errors

---

## 5. Run Tests

### Property-Based Tests
The property-based tests need mocking setup. Current issues:
- Tests expect Prisma models to be mockable
- Need to create test utilities for mocking

### Recommended Approach
**Skip property-based tests for now** and focus on:
1. Manual API testing
2. Integration tests with real database
3. E2E tests

### Alternative: Fix Tests
Create test utilities:
```typescript
// src/__tests__/utils/prisma-mock.ts
export const createMockPrismaService = () => ({
  building: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    // ... etc
  },
  // ... all other models
});
```

---

## 6. Start Application

### Development Mode
```powershell
npm run start:dev
```

### Expected Output
```
[Nest] 12345  - 02/21/2026, 12:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/21/2026, 12:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 02/21/2026, 12:00:00 AM     LOG [RoutesResolver] ResidentsController {/residents}:
[Nest] 12345  - 02/21/2026, 12:00:00 AM     LOG [RouterExplorer] Mapped {/buildings/:buildingId/residents, GET} route
...
[Nest] 12345  - 02/21/2026, 12:00:00 AM     LOG [NestApplication] Nest application successfully started
```

### Verify Endpoints
```powershell
# Check Swagger docs
Start-Process "http://localhost:3001/api"

# Test health endpoint (if exists)
curl http://localhost:3001/health
```

---

## 7. Manual API Testing

### Using Swagger UI
1. Navigate to `http://localhost:3001/api`
2. Test endpoints with authentication
3. Verify guards are working

### Using Postman/Thunder Client
Create requests for:
- `POST /auth/login` - Get JWT token
- `GET /buildings/:buildingId/residents` - Test residents endpoint
- `GET /buildings/:buildingId/reports/balance` - Test reports endpoint

---

## 8. Package Review & Alternatives

### Current Stack Analysis

#### ✅ Well-Chosen Packages
1. **@nestjs/*** - Industry standard for Node.js backend
2. **@prisma/client** - Best TypeScript ORM
3. **@ofeklabs/horizon-auth** - Custom auth package (already integrated)
4. **redis** - Standard Redis client
5. **class-validator** - Standard NestJS validation
6. **fast-check** - Best property-based testing library

#### ⚠️ Consider Alternatives

1. **BullMQ** (Current: `bullmq@5.69.3`)
   - ✅ Good choice for job queues
   - Alternative: `@nestjs/bull` (older, more stable)
   - Recommendation: **Keep BullMQ** (newer, better features)

2. **Socket.IO** (Current: `socket.io@4.8.3`)
   - ✅ Industry standard for WebSockets
   - Alternative: Native WebSockets, ws
   - Recommendation: **Keep Socket.IO** (best for real-time features)

3. **Winston** (Current: `winston@3.19.0`)
   - ✅ Most popular Node.js logger
   - Alternative: Pino (faster), Bunyan
   - Recommendation: **Keep Winston** (more features, better ecosystem)

4. **Sharp** (Current: `sharp@0.34.5`)
   - ✅ Fastest image processing library
   - Alternative: Jimp (pure JS, slower)
   - Recommendation: **Keep Sharp** (best performance)

5. **Nodemailer** (Current: `nodemailer@6.9.7`)
   - ✅ Standard email library
   - Alternative: SendGrid SDK, AWS SES SDK
   - Recommendation: **Keep Nodemailer** (flexible, works with any SMTP)

#### 🔧 Missing Packages (Consider Adding)

1. **@nestjs/terminus** - Health checks
   ```powershell
   npm install @nestjs/terminus --legacy-peer-deps
   ```

2. **@nestjs/schedule** - Cron jobs (if needed)
   ```powershell
   npm install @nestjs/schedule --legacy-peer-deps
   ```

3. **helmet** - Already installed ✅ (security headers)

4. **compression** - Already installed ✅ (response compression)

---

## 9. Security Checklist

### Before Production
- [ ] Change all default passwords
- [ ] Rotate JWT keys
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting (already have @nestjs/throttler)
- [ ] Enable IP whitelisting if needed
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure backup strategy
- [ ] Set up logging aggregation (Seq, ELK, etc.)

---

## 10. Production Deployment

### Build for Production
```powershell
npm run build
NODE_ENV=production npm run start:prod
```

### Docker Deployment (Recommended)
Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm run prisma:generate
EXPOSE 3001
CMD ["node", "dist/main"]
```

### Environment-Specific Configs
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

---

## Quick Start Commands

```powershell
# 1. Install Redis (if not done)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 2. Generate Prisma client (already done)
npm run prisma:generate

# 3. Run migrations
npm run prisma:migrate dev

# 4. Start application
npm run start:dev

# 5. Open Swagger docs
Start-Process "http://localhost:3001/api"
```

---

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Run `npm run prisma:generate`

### Issue: "Redis connection failed"
**Solution**: 
1. Check Redis is running: `docker ps` or `redis-cli ping`
2. Verify REDIS_HOST and REDIS_PORT in .env

### Issue: "Database connection failed"
**Solution**:
1. Check DATABASE_URL in .env
2. Verify Supabase database is accessible
3. Check firewall/network settings

### Issue: "Port 3001 already in use"
**Solution**:
1. Change PORT in .env
2. Or kill process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process`

### Issue: "JWT keys not found"
**Solution**: Run `npm run setup` to generate keys

---

## Next Steps After Deployment

1. **Monitoring**: Set up application monitoring
2. **Logging**: Configure centralized logging
3. **Backups**: Set up automated database backups
4. **CI/CD**: Set up GitHub Actions for automated deployment
5. **Documentation**: Create API documentation
6. **Load Testing**: Test application under load
7. **Security Audit**: Run security scans

---

## Summary

### Minimum Requirements to Run
1. ✅ Node.js and npm
2. ✅ PostgreSQL database (Supabase)
3. ⚠️ Redis server
4. ✅ Prisma client generated
5. ⚠️ Database migrations run
6. ⚠️ JWT keys generated

### Current Blockers
1. **Redis not installed** - Need to install Redis
2. **Migrations not run** - Need to run `npm run prisma:migrate dev`
3. **JWT keys** - Need to verify certs/ folder exists

### Estimated Time to Deploy
- Redis setup: 5-10 minutes
- Run migrations: 2-3 minutes
- Verify and start: 5 minutes
- **Total: ~15-20 minutes**
