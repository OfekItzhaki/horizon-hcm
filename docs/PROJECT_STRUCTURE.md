# Horizon HCM Project Structure

This document explains the project organization and file locations.

## Overview

This is a **monorepo** containing:
- **Backend API** (NestJS) - Root directory
- **Frontend Apps** (React/React Native) - `horizon-hcm-frontend/` directory

```
horizon-hcm/                          ← BACKEND (NestJS API)
├── src/                              ← Backend source code
├── prisma/                           ← Database schema & migrations
├── docs/                             ← Backend documentation
├── firebase-service-account.json     ← Backend FCM credentials (gitignored)
├── package.json                      ← Backend dependencies
└── horizon-hcm-frontend/             ← FRONTEND (React monorepo)
    ├── packages/
    │   ├── web/                      ← Web app (React + Vite)
    │   ├── mobile/                   ← Mobile app (Expo/React Native)
    │   │   └── google-services.json  ← Mobile FCM credentials (gitignored)
    │   └── shared/                   ← Shared code (API client, types, utils)
    └── package.json                  ← Frontend workspace dependencies
```

## Backend Structure (Root Directory)

### Source Code (`src/`)
```
src/
├── announcements/          ← Announcements module (CQRS)
├── apartments/             ← Apartments module (CQRS)
├── buildings/              ← Buildings module (CQRS)
├── common/                 ← Shared utilities (logger, guards, decorators)
├── documents/              ← Documents module
├── files/                  ← File upload/storage module
├── health/                 ← Health check endpoints
├── i18n/                   ← Internationalization
├── invoices/               ← Invoices module (CQRS) ✨ NEW
├── maintenance/            ← Maintenance requests module (CQRS)
├── meetings/               ← Meetings module (CQRS)
├── messages/               ← Messages module (CQRS) ✨ NEW
├── notifications/          ← Push notifications module
├── payments/               ← Payments module
├── polls/                  ← Polls module (CQRS) ✨ NEW
├── prisma/                 ← Prisma service
├── realtime/               ← WebSocket/SSE realtime module
├── registration/           ← User registration module
├── reports/                ← Reports module
├── residents/              ← Residents module (CQRS)
├── sync/                   ← Offline sync module
├── users/                  ← Users module (CQRS)
├── webhooks/               ← Webhooks module
├── app.module.ts           ← Root application module
└── main.ts                 ← Application entry point
```

### Module Structure (CQRS Pattern)

Each feature module follows this structure:
```
module-name/
├── commands/
│   ├── handlers/           ← Command handlers (write operations)
│   │   ├── create-*.handler.ts
│   │   ├── update-*.handler.ts
│   │   └── delete-*.handler.ts
│   └── impl/               ← Command implementations
│       ├── create-*.command.ts
│       ├── update-*.command.ts
│       └── delete-*.command.ts
├── queries/
│   ├── handlers/           ← Query handlers (read operations)
│   │   ├── get-*.handler.ts
│   │   └── list-*.handler.ts
│   └── impl/               ← Query implementations
│       ├── get-*.query.ts
│       └── list-*.query.ts
├── dto/                    ← Data Transfer Objects (validation)
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── *.dto.ts
├── module-name.controller.ts  ← REST API endpoints
├── module-name.module.ts      ← Module definition
└── module-name.service.ts     ← Business logic (if needed)
```

### Database (`prisma/`)
```
prisma/
├── migrations/             ← Database migrations (auto-generated)
│   ├── 20260224015100_add_read_at_and_theme_fields/
│   ├── 20260224020000_add_polls_table/
│   ├── 20260224004638_add_messages_table/
│   └── 20260224005336_add_invoices_table/
└── schema.prisma           ← Database schema definition
```

### Documentation (`docs/`)
```
docs/
├── ARCHITECTURE.md         ← System architecture overview
├── DEPLOYMENT.md           ← Deployment guide
├── ENV_VARIABLES.md        ← Environment variables reference
└── ...
```

### Configuration Files (Root)
```
.env                        ← Environment variables (gitignored)
.env.example                ← Environment variables template
package.json                ← Backend dependencies
tsconfig.json               ← TypeScript configuration
nest-cli.json               ← NestJS CLI configuration
.eslintrc.js                ← ESLint configuration
.prettierrc                 ← Prettier configuration
docker-compose.yml          ← Docker services (PostgreSQL, Redis)
```

### Firebase Credentials (Root)
```
firebase-service-account.json  ← Backend FCM credentials (gitignored)
FCM_SETUP_GUIDE.md            ← FCM setup instructions
```

## Frontend Structure (`horizon-hcm-frontend/`)

### Web App (`packages/web/`)
```
packages/web/
├── src/
│   ├── components/         ← React components
│   ├── hooks/              ← Custom React hooks
│   ├── layouts/            ← Page layouts
│   ├── pages/              ← Page components
│   ├── utils/              ← Utility functions
│   └── App.tsx             ← Root component
├── public/                 ← Static assets
├── package.json            ← Web app dependencies
└── vite.config.ts          ← Vite configuration
```

### Mobile App (`packages/mobile/`)
```
packages/mobile/
├── src/
│   ├── components/         ← React Native components
│   ├── hooks/              ← Custom hooks
│   ├── navigation/         ← Navigation configuration
│   ├── screens/            ← Screen components
│   ├── theme/              ← Theme configuration
│   └── utils/              ← Utility functions
├── assets/                 ← Images, fonts, etc.
├── google-services.json    ← Mobile FCM credentials (gitignored)
├── app.json                ← Expo configuration
├── package.json            ← Mobile app dependencies
└── PUSH_NOTIFICATIONS_SETUP.md  ← Push notifications guide
```

### Shared Package (`packages/shared/`)
```
packages/shared/
├── src/
│   ├── api/                ← API client (Axios)
│   ├── constants/          ← Shared constants
│   ├── schemas/            ← Zod validation schemas
│   ├── store/              ← Zustand state management
│   ├── types/              ← TypeScript types
│   └── utils/              ← Shared utilities
└── package.json            ← Shared package dependencies
```

## Key Files Location Reference

### Backend Files
| File | Location | Purpose |
|------|----------|---------|
| Backend API | `src/` | NestJS source code |
| Database schema | `prisma/schema.prisma` | Prisma schema |
| Migrations | `prisma/migrations/` | Database migrations |
| Environment config | `.env` | Environment variables |
| FCM credentials | `firebase-service-account.json` | Backend push notifications |
| API documentation | `http://localhost:3001/api/docs` | Swagger UI |

### Frontend Files
| File | Location | Purpose |
|------|----------|---------|
| Web app | `horizon-hcm-frontend/packages/web/` | React web app |
| Mobile app | `horizon-hcm-frontend/packages/mobile/` | Expo mobile app |
| Shared code | `horizon-hcm-frontend/packages/shared/` | Shared utilities |
| Mobile FCM | `horizon-hcm-frontend/packages/mobile/google-services.json` | Mobile push notifications |

## Running the Project

### Backend (from root directory)
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Database
npx prisma migrate deploy
npx prisma generate
npx prisma studio
```

### Frontend Web (from horizon-hcm-frontend/packages/web/)
```bash
npm run dev          # Development server
npm run build        # Production build
```

### Frontend Mobile (from horizon-hcm-frontend/packages/mobile/)
```bash
npm start            # Start Expo
npm run android      # Run on Android
npm run ios          # Run on iOS
```

## Port Assignments

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| Swagger Docs | 3001 | http://localhost:3001/api/docs |
| Web App | 3000 | http://localhost:3000 |
| Mobile App | 8081 | Expo DevTools |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

## Firebase Configuration

### Two Different Files Required

1. **Backend**: `firebase-service-account.json` (root directory)
   - Used by backend to SEND push notifications
   - Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
   - Contains: `type`, `private_key`, `client_email`

2. **Mobile**: `google-services.json` (mobile app directory)
   - Used by mobile app to RECEIVE push notifications
   - Download from: Firebase Console → Project Settings → General → Your apps → Download google-services.json
   - Contains: `project_info`, `client`, `api_key`

## Common Issues

### "Where is the backend?"
- The root directory IS the backend
- Backend source code is in `src/`
- Frontend is in `horizon-hcm-frontend/`

### "FCM not working"
- Check you have BOTH Firebase files in correct locations
- Backend: `firebase-service-account.json` (root)
- Mobile: `google-services.json` (mobile app)
- See `FCM_SETUP_GUIDE.md` for details

### "Module not found"
- Backend: Run `npm install` in root directory
- Frontend: Run `npm install` in `horizon-hcm-frontend/`

## Documentation Index

| Document | Location | Purpose |
|----------|----------|---------|
| Project Structure | `PROJECT_STRUCTURE.md` | This file |
| Backend Architecture | `docs/ARCHITECTURE.md` | Backend design |
| Backend Deployment | `docs/DEPLOYMENT.md` | Deployment guide |
| FCM Setup | `FCM_SETUP_GUIDE.md` | Push notifications (backend) |
| Mobile Push Setup | `horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md` | Push notifications (mobile) |
| Frontend Architecture | `horizon-hcm-frontend/ARCHITECTURE.md` | Frontend design |
| Frontend Deployment | `horizon-hcm-frontend/DEPLOYMENT.md` | Frontend deployment |

## Next Steps

1. ✅ Backend API running on port 3001
2. ✅ Database schema updated with polls, messages, invoices
3. ✅ CQRS pattern implemented for all modules
4. ✅ Mobile app configured for FCM
5. ⏳ Download `firebase-service-account.json` for backend
6. ⏳ Test push notifications end-to-end
7. ⏳ Implement notification handling in mobile app
