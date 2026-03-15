# Redis Setup Guide for Horizon HCM

Redis is required for the Horizon HCM backend to run. Here are your options:

## Option 1: Docker Desktop (Recommended)

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop

2. **Start Redis**
   ```bash
   cd backend
   docker-compose up -d redis
   ```

3. **Verify Redis is running**
   ```bash
   docker ps
   ```

## Option 2: Redis for Windows (Native)

1. **Install Redis using WSL2**
   ```bash
   # In WSL2 terminal
   sudo apt-get update
   sudo apt-get install redis-server
   sudo service redis-server start
   ```

2. **Or use Memurai (Redis-compatible for Windows)**
   - Download from: https://www.memurai.com/
   - Install and start the service

## Option 3: Cloud Redis (For Production)

Use a managed Redis service:
- **Redis Cloud**: https://redis.com/try-free/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Azure Cache for Redis**: https://azure.microsoft.com/en-us/services/cache/

Update `.env` with connection details:
```env
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password  # if required
```

## Verify Redis Connection

After starting Redis, test the connection:

```bash
# Using redis-cli (if installed)
redis-cli ping
# Should return: PONG

# Or test from the app
cd backend
npm run start:dev
# Check logs for "Redis Client Connected"
```

## Troubleshooting

### "Cannot connect to Redis"
- Ensure Redis is running: `docker ps` or `sudo service redis-server status`
- Check port 6379 is not blocked by firewall
- Verify REDIS_HOST and REDIS_PORT in .env

### "Docker daemon not running"
- Start Docker Desktop application
- Wait for Docker to fully start (check system tray icon)

### "Port 6379 already in use"
- Another Redis instance is running
- Stop it: `docker stop horizon-hcm-redis` or `sudo service redis-server stop`
