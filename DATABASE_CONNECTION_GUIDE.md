# Database Connection Troubleshooting Guide

## Current Status

✅ **Redis**: Running and verified (PONG response)  
❌ **Database**: Connection failing with "Tenant or user not found"

## Error Details

```
Error: FATAL: Tenant or user not found
```

This error typically means:
1. Database credentials are incorrect or expired
2. Connection pooler has issues
3. IP address is not whitelisted
4. Database user doesn't exist

## Current Connection String

```
postgresql://postgres.grukydydpmavenredfvf:Kurome%409890@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

**Type**: Supabase Connection Pooler (Transaction mode)

## Steps to Fix

### Step 1: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Check if the database is running
5. Verify the connection string

### Step 2: Get Direct Connection String

Instead of using the pooler, try the direct connection:

1. In Supabase Dashboard → **Settings** → **Database**
2. Look for **Connection string** section
3. Select **Direct connection** (not pooler)
4. Copy the connection string
5. It should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.grukydydpmavenredfvf.supabase.co:5432/postgres
   ```

### Step 3: Update .env File

Replace the DATABASE_URL in `.env` with the direct connection string:

```env
# Old (pooler - not working)
DATABASE_URL="postgresql://postgres.grukydydpmavenredfvf:Kurome%409890@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# New (direct connection)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.grukydydpmavenredfvf.supabase.co:5432/postgres"
```

**Important**: Make sure to URL-encode special characters in the password:
- `@` becomes `%40`
- `!` becomes `%21`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`

### Step 4: Check IP Whitelist

1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection pooling** section
3. Check if your IP is whitelisted
4. Add your current IP or use `0.0.0.0/0` for development (allows all IPs)

### Step 5: Verify Password

The current password appears to be: `Kurome@9890`

If this is incorrect:
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Click **Reset database password**
3. Copy the new password
4. Update DATABASE_URL in `.env`

### Step 6: Test Connection

After updating `.env`, test the connection:

```powershell
# Test 1: Pull schema (read-only test)
npx prisma db pull

# Test 2: Check connection
npx prisma db execute --stdin <<< "SELECT 1"

# Test 3: Open Prisma Studio
npx prisma studio
```

### Step 7: Run Migrations

Once connection works:

```powershell
# Create initial migration
npx prisma migrate dev --name init

# Or if tables already exist
npx prisma db push
```

## Alternative: Use Different Database

If Supabase continues to have issues, you can:

### Option A: Local PostgreSQL

```powershell
# Using Docker
docker run -d `
  --name postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=horizon_hcm `
  -p 5432:5432 `
  postgres:15-alpine

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/horizon_hcm"
```

### Option B: Different Cloud Provider

- **Neon**: https://neon.tech (Free tier, instant setup)
- **Railway**: https://railway.app (Free tier)
- **ElephantSQL**: https://www.elephantsql.com (Free tier)

## Quick Verification Commands

```powershell
# 1. Check if Redis is running
docker ps | Select-String redis

# 2. Test Redis connection
docker exec redis redis-cli ping

# 3. Check environment variables
Get-Content .env | Select-String DATABASE_URL

# 4. Test database connection
npx prisma db pull

# 5. View current schema
npx prisma studio
```

## Expected Success Output

When database connection works, you should see:

```
✔ Introspected 30 models and wrote them into prisma\schema.prisma in 2.5s
```

Or for migrations:

```
✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 295ms
```

## Next Steps After Connection Works

1. ✅ Redis running
2. ✅ Database connected
3. Run migrations: `npx prisma migrate dev --name init`
4. Start app: `npm run start:dev`
5. Test endpoints: `http://localhost:3001/api`

## Common Issues

### Issue: "SSL connection required"
**Solution**: Add `?sslmode=require` to connection string

### Issue: "Connection timeout"
**Solution**: 
- Check firewall
- Verify database is running
- Try direct connection instead of pooler

### Issue: "Password authentication failed"
**Solution**: 
- Reset password in Supabase
- Ensure password is URL-encoded
- Check for typos

### Issue: "Database does not exist"
**Solution**: 
- Verify database name in connection string
- Create database in Supabase dashboard

## Contact Support

If issues persist:
1. Check Supabase status: https://status.supabase.com
2. Supabase Discord: https://discord.supabase.com
3. Check Supabase logs in dashboard

---

**Current Status**: Waiting for database connection fix  
**Blocker**: Supabase connection pooler issue  
**Estimated Fix Time**: 5-10 minutes
