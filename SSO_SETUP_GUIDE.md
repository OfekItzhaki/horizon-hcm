# 🔐 Authentication Mode Configuration Guide

## Overview
This guide explains how to configure Horizon-HCM authentication modes. The app is currently configured for **Full Mode (Standalone)** with embedded authentication.

---

## 🎯 Current Configuration: Full Mode (Standalone)

Your app is currently configured for **Full Mode**, which means:
- ✅ Auth package runs embedded in your app
- ✅ Manages users, sessions, 2FA, device management
- ✅ Uses local database and Redis
- ✅ Self-contained authentication system

**Current `.env` configuration:**
```env
AUTH_MODE=full
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/horizon_hcm?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## 🎯 Authentication Modes Explained

### Full Mode (Standalone)
- Auth package runs embedded in your app
- Requires database and Redis
- Manages users, sessions, 2FA, etc.
- Use when: Building a standalone application

### SSO Mode (Centralized Auth)
- Auth package runs as a separate service
- Your app only verifies JWT tokens
- Auth service manages users, sessions, 2FA, etc.
- Use when: Multiple apps share authentication

---

## 🚀 Using Full Mode (Current Configuration)

### Step 1: Verify JWT Keys Exist

```bash
# Check if keys exist
ls -la certs/

# If keys don't exist, generate them
node scripts/generate-keys.js
```

---

### Step 2: Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Seq
npm run dev:start
```

**Verify services are running:**
```bash
# Check Docker containers
docker ps

# Should see: postgres, redis, seq
```

---

### Step 3: Run Database Migrations

```bash
# Run Horizon-HCM migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

---

### Step 4: Start Application

```bash
# Start in development mode
npm run start:dev
```

**Expected output:**
```
[Bootstrap] Application is running on: http://localhost:3001
[Bootstrap] Swagger documentation: http://localhost:3001/api/docs
```

---

## 🧪 Testing Full Mode

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

**Expected:** `{"status":"ok"}`

---

### Test 2: Register User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@horizon-hcm.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected:** User created with JWT token

---

### Test 3: Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@horizon-hcm.com",
    "password": "SecurePass123!"
  }'
```

**Expected:** JWT access token returned

---

### Test 4: Access Protected Endpoint
```bash
# Use the token from login
curl -X GET http://localhost:3001/buildings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** Buildings data returned

---

## 🔄 Switching to SSO Mode (Optional)

If you want to use a centralized auth service instead:

### Step 1: Start Your Auth Service

In your auth service directory:
```bash
# Configure for Full mode
AUTH_MODE=full

# Start the auth service (typically on port 3002)
npm run start:dev
```

**Verify auth service is running:**
```bash
curl http://localhost:3002/health
```

---

### Step 2: Configure Horizon-HCM for SSO Mode

Update your `.env`:

```env
# Switch to SSO mode
AUTH_MODE=sso

# Auth Service URL (where your auth service is running)
AUTH_SERVICE_URL=http://localhost:3002

# JWT Public Key (for verifying tokens from auth service)
JWT_PUBLIC_KEY_PATH=./certs/public.pem

# Cookie Domain (must match auth service)
COOKIE_DOMAIN=".horizon-hcm.com"

# Database and Redis still needed for app data (not auth)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/horizon_hcm?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

**Important:** Make sure the JWT public key matches the one used by your auth service!

---

### Step 3: Copy Public Key from Auth Service

```bash
# Copy public key from auth service to Horizon-HCM
cp /path/to/auth-service/certs/public.pem ./certs/public.pem
```

Or set it directly in `.env`:
```env
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
```

---

### Step 4: Restart Horizon-HCM

```bash
# Restart the application
npm run start:dev
```

---

## 🧪 Testing SSO Mode

### Test 1: Register User via Auth Service
```bash
# Register on auth service (port 3002)
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@horizon-hcm.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

---

### Test 2: Login via Auth Service
```bash
# Login on auth service
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@horizon-hcm.com",
    "password": "SecurePass123!"
  }'
```

**Save the access_token from the response!**

---

### Test 3: Use Token in Horizon-HCM
```bash
# Use the token to access Horizon-HCM endpoints
curl -X GET http://localhost:3001/buildings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** Request succeeds, token is verified by Horizon-HCM

---

## 🔍 How SSO Mode Works

### Authentication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │ Auth Service│         │ Horizon-HCM │
│  (Browser)  │         │ (Port 3002) │         │ (Port 3001) │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │                       │
       │  1. POST /auth/login  │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │  2. JWT Token         │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │  3. GET /buildings    │                       │
       │  (with JWT token)     │                       │
       │───────────────────────────────────────────────>│
       │                       │                       │
       │                       │  4. Verify JWT        │
       │                       │  (using public key)   │
       │                       │                       │
       │  5. Building data     │                       │
       │<───────────────────────────────────────────────│
```

### Key Points

1. **Auth Service** (Full Mode):
   - Manages user database
   - Handles registration, login, 2FA
   - Signs JWT tokens with private key
   - Runs on port 3002

2. **Horizon-HCM** (SSO Mode):
   - Does NOT manage users
   - Only verifies JWT tokens with public key
   - Trusts auth service for authentication
   - Runs on port 3001

3. **JWT Token**:
   - Signed by auth service (private key)
   - Verified by Horizon-HCM (public key)
   - Contains user ID, email, roles
   - Shared across all apps using same auth service

---

## 🔧 Configuration Reference

### Environment Variables (Full Mode - Current)

**Required:**
```env
AUTH_MODE=full
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/horizon_hcm?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
COOKIE_DOMAIN=".horizon-hcm.com"
```

**Feature Flags:**
```env
ENABLE_2FA=true
ENABLE_DEVICE_MGMT=true
MAX_DEVICES=10
ENABLE_PUSH=true
ENABLE_ACCOUNT_MGMT=true
ALLOW_REACTIVATION=true
```

**Application:**
```env
PORT=3001
NODE_ENV=development
APP_NAME="Horizon-HCM"
FRONTEND_URL="http://localhost:3000"
```

---

### Environment Variables (SSO Mode - Optional)

**Required:**
```env
AUTH_MODE=sso
AUTH_SERVICE_URL=http://localhost:3002
JWT_PUBLIC_KEY_PATH=./certs/public.pem
COOKIE_DOMAIN=".horizon-hcm.com"
```

**Still Required (for app data, not auth):**
```env
DATABASE_URL="postgresql://..."
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Not Used in SSO Mode:**
```env
# These are managed by the auth service
ENABLE_2FA=...
ENABLE_DEVICE_MGMT=...
```

---

## 🐛 Troubleshooting

### Issue: "Invalid token" errors

**Cause:** Public key mismatch

**Solution:**
1. Verify public key matches auth service
2. Check JWT token at jwt.io
3. Ensure token is not expired

```bash
# Copy public key from auth service
cp /path/to/auth-service/certs/public.pem ./certs/public.pem
```

---

### Issue: "Cannot connect to auth service"

**Cause:** Auth service not running or wrong URL

**Solution:**
1. Verify auth service is running:
   ```bash
   curl http://localhost:3002/health
   ```

2. Check AUTH_SERVICE_URL in .env
3. Ensure ports don't conflict

---

### Issue: "Cookie domain mismatch"

**Cause:** Cookie domains don't match between services

**Solution:**
Both services must use the same COOKIE_DOMAIN:
```env
# In both auth service and Horizon-HCM
COOKIE_DOMAIN=".horizon-hcm.com"
```

---

### Issue: "User not found" in Horizon-HCM

**Cause:** User exists in auth service but not in Horizon-HCM database

**Solution:**
This is expected! In SSO mode:
- Auth service manages users
- Horizon-HCM only verifies tokens
- You may need to sync user data if needed

---

## 🔄 Mode Comparison

| Feature | Full Mode (Current) | SSO Mode |
|---------|-------------------|----------|
| **Auth Management** | Embedded in app | Separate service |
| **User Database** | Local | Auth service |
| **JWT Signing** | Local (private key) | Auth service |
| **JWT Verification** | Local (public key) | Local (public key) |
| **2FA Management** | Local | Auth service |
| **Device Management** | Local | Auth service |
| **Database Required** | Yes (auth + app data) | Yes (app data only) |
| **Redis Required** | Yes (sessions + cache) | Yes (cache only) |
| **Best For** | Standalone apps | Multi-app ecosystems |

---

## 🔄 Switching Between Modes

### Switch to Full Mode (Standalone)

1. Update `.env`:
   ```env
   AUTH_MODE=full
   DATABASE_URL="postgresql://..."
   ```

2. Run auth migrations:
   ```bash
   npx prisma migrate deploy --schema=./node_modules/@ofeklabs/horizon-auth/prisma/schema.prisma
   ```

3. Restart application

---

### Switch to SSO Mode (Centralized)

1. Update `.env`:
   ```env
   AUTH_MODE=sso
   AUTH_SERVICE_URL=http://localhost:3002
   ```

2. Ensure public key is available

3. Restart application

---

## ✅ Verification Checklist

### Full Mode (Current Configuration)
- [ ] Docker containers running (PostgreSQL, Redis, Seq)
- [ ] JWT keys exist in certs/ folder
- [ ] Database migrations completed
- [ ] Health check passes at /health
- [ ] Can register users at /auth/register
- [ ] Can login at /auth/login
- [ ] Protected endpoints work with JWT token
- [ ] 2FA, device management features available

### SSO Mode (If Switching)
- [ ] Auth service running on port 3002
- [ ] Auth service health check passes
- [ ] Public key copied from auth service
- [ ] Horizon-HCM running on port 3001
- [ ] Horizon-HCM health check passes
- [ ] Can verify JWT from auth service
- [ ] Protected endpoints work with auth service token
- [ ] Cookie domains match between services

---

## 📚 Additional Resources

- **Auth Package Docs:** https://github.com/OfekItzhaki/horizon-auth-platform
- **JWT Debugger:** https://jwt.io
- **Testing Guide:** See COMPREHENSIVE_TESTING_GUIDE.md

---

## 🎯 Quick Reference

### Full Mode Endpoints (Port 3001 - Current)
```
# Authentication
POST /auth/register
POST /auth/login
POST /auth/2fa/enable
GET  /auth/devices
POST /auth/logout

# Application
GET  /health
GET  /buildings
POST /buildings
GET  /apartments
...
```

### SSO Mode Setup (Optional)
```
# Auth Service (Port 3002)
POST /auth/register
POST /auth/login
POST /auth/2fa/enable

# Horizon-HCM (Port 3001)
GET  /health
GET  /buildings
POST /buildings
```

### Token Usage (Full Mode)
```bash
# Register and login in one app
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}' \
  | jq -r '.access_token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/buildings
```

---

**You're all set! 🚀**

Your Horizon-HCM app is configured for Full Mode (standalone authentication).
