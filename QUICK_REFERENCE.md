# Quick Reference Guide

## Where Am I?

You are in the **BACKEND** directory (NestJS API server).

```
📍 YOU ARE HERE: horizon-hcm/ (Backend)
   ├── src/              ← Backend code
   ├── prisma/           ← Database
   ├── docs/             ← Backend docs
   └── horizon-hcm-frontend/  ← Frontend (separate directory)
```

## Common Tasks

### Start Backend Server
```bash
npm run start:dev
# Runs on http://localhost:3001
```

### Start Frontend
```bash
# Web app
cd horizon-hcm-frontend/packages/web
npm run dev

# Mobile app
cd horizon-hcm-frontend/packages/mobile
npm start
```

### Database Operations
```bash
# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open database GUI
npx prisma studio
```

### Run Tests
```bash
npm test                    # All tests
npm run test:cov           # With coverage
```

## File Locations

### Backend Files (Root Directory)
| What | Where |
|------|-------|
| API source code | `src/` |
| Database schema | `prisma/schema.prisma` |
| Migrations | `prisma/migrations/` |
| Environment config | `.env` |
| FCM credentials | `firebase-service-account.json` |
| Documentation | `docs/` |

### Frontend Files (horizon-hcm-frontend/)
| What | Where |
|------|-------|
| Web app | `packages/web/` |
| Mobile app | `packages/mobile/` |
| Shared code | `packages/shared/` |
| Mobile FCM | `packages/mobile/google-services.json` |

## Important URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| Web App | http://localhost:3000 |
| Database GUI | http://localhost:5555 (Prisma Studio) |

## Firebase Setup

### Backend (Send Notifications)
1. Download from: Firebase Console → Service Accounts → Generate new private key
2. Save as: `firebase-service-account.json` (root directory)
3. File should have: `"type": "service_account"`, `"private_key"`, `"client_email"`

### Mobile (Receive Notifications)
1. Download from: Firebase Console → General → Your apps → Download google-services.json
2. Save as: `horizon-hcm-frontend/packages/mobile/google-services.json`
3. File should have: `"project_info"`, `"client"`, `"api_key"`

## Module Structure (CQRS)

Every feature module follows this pattern:

```
src/module-name/
├── commands/
│   ├── handlers/       ← Write operations
│   └── impl/           ← Command definitions
├── queries/
│   ├── handlers/       ← Read operations
│   └── impl/           ← Query definitions
├── dto/                ← Validation
├── module.ts           ← Module definition
└── controller.ts       ← REST endpoints
```

## Recent Features

### ✅ Completed
- Polls API (voting system)
- Messages API (direct messaging)
- Invoices API (billing)
- Push notifications (FCM integration)

### ⏳ In Progress
- Firebase service account setup
- Notification templates
- End-to-end testing

## Need Help?

| Topic | Document |
|-------|----------|
| Project structure | `docs/PROJECT_STRUCTURE.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| FCM setup | `docs/FCM_SETUP_GUIDE.md` |
| Environment vars | `docs/ENV_VARIABLES.md` |

## Common Issues

### "Backend not starting"
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Install dependencies
npm install

# Check .env file exists
```

### "Database error"
```bash
# Regenerate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy
```

### "FCM not working"
- Check `firebase-service-account.json` exists in root
- Check file has `"type": "service_account"`
- Restart backend server
- Check logs for "✅ FCM Provider initialized"

## Code Quality

### Before Committing
```bash
npm run lint            # Check linting
npm run format          # Format code
npm test                # Run tests
```

### File Size Guidelines
- Controllers: < 400 lines
- Services: < 400 lines
- Handlers: < 100 lines each
- DTOs: < 50 lines each

All current files meet these guidelines ✅

## Testing

### Property-Based Tests
```bash
# Run all PBT tests
npm test -- --testPathPattern=properties

# Run specific module
npm test -- --testPathPattern=polls.properties
```

136 property-based tests passing ✅

## Environment Variables

Key variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

# FCM
FCM_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Server
PORT=3001
NODE_ENV=development
```

See `docs/ENV_VARIABLES.md` for complete list.
