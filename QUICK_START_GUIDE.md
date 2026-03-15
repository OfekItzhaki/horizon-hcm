# 🚀 Quick Start Guide - Horizon HCM

**Status**: ✅ All applications built and ready

---

## 🎯 What You Have

| Component | Status | Location | Command |
|-----------|--------|----------|---------|
| Backend | ✅ Built | `backend/dist/` | `npm run start:prod` |
| Web App | ✅ Built | `web-app/dist/` | Deploy to Vercel/Netlify |
| Mobile App | ✅ Ready | `mobile-app/` | `eas build --platform android` |

---

## ⚡ Quick Commands

### Start Backend (Development)
```bash
cd backend
npm run start:dev
# Runs on http://localhost:3001
```

### Start Web App (Development)
```bash
cd web-app
npm run dev
# Runs on http://localhost:5173
```

### Start Mobile App (Development)
```bash
cd mobile-app
npm start
# Scan QR code with Expo Go app
```

### Build Mobile App
```bash
cd mobile-app
eas init                    # One-time setup
eas build --platform android
```

---

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@horizon.com | Password123! |
| Committee | committee@horizon.com | Password123! |
| Owner | owner@horizon.com | Password123! |
| Tenant | tenant@horizon.com | Password123! |

---

## 📋 Deployment Checklist

### Backend
- [ ] Choose hosting provider (AWS, Heroku, DigitalOcean, etc.)
- [ ] Set environment variables (DATABASE_URL, REDIS_HOST, JWT keys)
- [ ] Deploy `backend/dist/` folder
- [ ] Run database migrations
- [ ] Verify health check: `GET /health`

### Web App
- [ ] Choose hosting provider (Vercel, Netlify, AWS S3, etc.)
- [ ] Set environment variables (VITE_API_URL, VITE_WS_URL)
- [ ] Deploy `web-app/dist/` folder
- [ ] Verify app loads and connects to backend

### Mobile App
- [ ] Run `eas init` in mobile-app directory
- [ ] Build for Android: `eas build --platform android`
- [ ] Build for iOS: `eas build --platform ios` (optional)
- [ ] Submit to Google Play Store and/or Apple App Store

---

## 🧪 Testing

### Run All Tests
```bash
# Backend
cd backend && npm test

# Web App
cd web-app && npm test

# Mobile App
cd mobile-app && npm run type-check
```

### API Testing
```bash
# Swagger UI
http://localhost:3001/api/docs

# Health check
curl http://localhost:3001/health

# Seed database
curl -X POST http://localhost:3001/seed
```

---

## 🔧 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/horizon_hcm
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_PRIVATE_KEY=<your-private-key>
JWT_PUBLIC_KEY=<your-public-key>
NODE_ENV=production
```

### Web App (.env)
```
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

### Mobile App (.env)
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_WS_URL=wss://api.yourdomain.com
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Horizon HCM                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Web App     │  │  Mobile App  │  │  Admin   │ │
│  │  (React)     │  │  (React Nav) │  │  Panel   │ │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │               │       │
│         └─────────────────┼───────────────┘       │
│                           │                       │
│                    ┌──────▼──────┐                │
│                    │  API Gateway │                │
│                    │  (NestJS)    │                │
│                    └──────┬───────┘                │
│                           │                       │
│         ┌─────────────────┼─────────────────┐    │
│         │                 │                 │    │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼──┐ │
│    │PostgreSQL│      │  Redis  │      │ Files │ │
│    │Database  │      │ Cache   │      │Storage│ │
│    └──────────┘      └─────────┘      └───────┘ │
│                                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Features Implemented

### Core HCM
- ✅ Apartment management
- ✅ Resident directory
- ✅ Payment tracking
- ✅ Maintenance requests
- ✅ Meetings & voting
- ✅ Document library
- ✅ Announcements
- ✅ Financial reports

### Infrastructure
- ✅ Real-time updates (WebSocket)
- ✅ Push notifications
- ✅ File uploads & processing
- ✅ Offline sync
- ✅ Caching (Redis)
- ✅ Monitoring & alerts
- ✅ Audit logging
- ✅ GDPR compliance

### Security
- ✅ JWT authentication
- ✅ Biometric auth (mobile)
- ✅ Request signing
- ✅ Device fingerprinting
- ✅ Anomaly detection
- ✅ Rate limiting
- ✅ CORS protection

---

## 📞 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Check database connection
npm run prisma:studio

# Check logs
tail -f backend/logs/error-*.log
```

### Web app won't connect to backend
```bash
# Check CORS is enabled
curl -H "Origin: http://localhost:5173" http://localhost:3001/health

# Check API URL in .env
cat web-app/.env

# Check backend is running
curl http://localhost:3001/health
```

### Mobile app won't build
```bash
# Check EAS is initialized
cat mobile-app/app.json | grep projectId

# Check EAS authentication
eas whoami

# Check app.json is valid
npx expo config --json
```

---

## 📚 Documentation

- `FINAL_BUILD_STATUS.md` - Complete build status
- `MOBILE_APP_BUILD_STATUS.md` - Mobile app build guide
- `INFRASTRUCTURE_COMPLETE.md` - Infrastructure overview
- `backend/docs/DEPLOYMENT_GUIDE.md` - Deployment procedures
- `backend/docs/MONITORING_AND_ALERTING.md` - Monitoring setup

---

## 🚀 Next Steps

1. **Initialize Mobile App**
   ```bash
   cd mobile-app
   eas init
   ```

2. **Build Mobile App**
   ```bash
   eas build --platform android
   ```

3. **Deploy Backend**
   - Choose hosting provider
   - Set environment variables
   - Deploy `backend/dist/`

4. **Deploy Web App**
   - Choose hosting provider
   - Set environment variables
   - Deploy `web-app/dist/`

5. **Submit Mobile App**
   - Google Play Store (Android)
   - Apple App Store (iOS)

---

## ✅ Verification Checklist

- [ ] Backend starts without errors
- [ ] Web app loads and connects to backend
- [ ] Can login with test credentials
- [ ] Can create/edit apartments
- [ ] Can create/view announcements
- [ ] Can submit maintenance requests
- [ ] Real-time updates work
- [ ] Push notifications work
- [ ] Mobile app builds successfully
- [ ] All tests pass

---

## 🎊 You're Ready!

All applications are built and ready for deployment. Follow the deployment checklist above to get your Horizon HCM system live!

**Questions?** Check the documentation or review the spec files in `.kiro/specs/`

