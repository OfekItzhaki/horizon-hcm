# 🚀 How to Start Horizon HCM Backend

## ✅ What's Ready

All Prisma model name fixes are **COMPLETE**:
- ✅ 297 compilation errors fixed
- ✅ Build passing (0 errors)
- ✅ All code compiles successfully
- ✅ 60+ files fixed across all modules

## 🎯 Quick Start (3 Steps)

### Step 1: Start Docker Desktop
- Open Docker Desktop application
- Wait for it to fully start (check system tray icon)

### Step 2: Start Redis
```bash
cd backend
docker-compose up -d redis
```

Verify Redis is running:
```bash
docker ps
# Should show: horizon-hcm-redis
```

### Step 3: Start Backend
```bash
# Still in backend folder
npm run start:dev
```

The backend will start on: **http://localhost:3001**

---

## 🔍 Verify It's Working

Once started, you should see:
```
[Nest] Application is running on: http://localhost:3001
[Nest] Swagger documentation: http://localhost:3001/api/docs
[CacheService] Redis Client Connected
```

Visit:
- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs

---

## 🐛 Troubleshooting

### "Docker daemon not running"
**Solution**: Start Docker Desktop and wait for it to fully initialize

### "Cannot connect to Redis"
**Solution**: 
```bash
# Check if Redis is running
docker ps

# If not, start it
cd backend
docker-compose up -d redis
```

### "Port 3001 already in use"
**Solution**: Stop any other process using port 3001
```bash
# Windows
netstat -ano | findstr :3001
# Kill the process using the PID shown
```

---

## 📦 Alternative: Redis Without Docker

If you can't use Docker, install Redis directly:

### Option 1: WSL2 (Recommended for Windows)
```bash
# In WSL2 terminal
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

### Option 2: Memurai (Redis for Windows)
1. Download from: https://www.memurai.com/
2. Install and start the service
3. No configuration needed (uses default port 6379)

### Option 3: Redis for Windows (Legacy)
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`

---

## 🎉 You're All Set!

The Prisma fixes are complete. Just start Redis and run the backend!

**Need help?** Check:
- `PROJECT_STATUS.md` - Current status
- `WORK_COMPLETED.md` - What was fixed
- `SETUP_REDIS.md` - Detailed Redis setup
