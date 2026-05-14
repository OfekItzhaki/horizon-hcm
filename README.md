# Horizon HCM

House Committee Management platform for residential buildings. Manage finances, communication, maintenance, and operations — all in one place.

## Architecture

```
horizon-hcm/
├── backend/          NestJS API (TypeScript, Prisma, Redis, BullMQ)
├── web-app/          React SPA (Vite, React Query, Zustand)
├── mobile-app/       React Native (Expo)
├── shared/           Shared types, API client, validation schemas
└── docs/             Project documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL (Supabase) |
| Caching | Redis |
| Queue | BullMQ |
| Web Frontend | React, Vite, React Query, Zustand, Zod |
| Mobile | React Native, Expo |
| Auth | JWT (RS256), 2FA, device management |
| Real-time | Socket.IO with Redis adapter |
| Notifications | FCM, APNS, Web Push, Email (Resend) |

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (local or remote)
- PostgreSQL (or Supabase account)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL, JWT keys, etc.
npx prisma generate
npx prisma migrate deploy
npm run start:dev      # http://localhost:3001
```

Swagger docs: http://localhost:3001/api/docs

### Web App

```bash
cd web-app
npm install
npm run dev            # http://localhost:3000
```

### Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

### Seed Data

With the backend running:

```bash
curl -X POST http://localhost:3001/seed
```

All seeded accounts use password `Password123!`

## Features

- Authentication (JWT, 2FA, password reset, device management)
- Building & apartment management
- Resident management with role-based access
- Invoice & payment system
- Financial reports (balance, income/expense, budget comparison, YoY)
- Announcements with targeting and read confirmation
- Direct messaging (real-time)
- Polls & voting
- Maintenance requests with photo uploads
- Meetings with RSVP and voting
- Document management
- Push notifications (FCM, APNS, Web Push)
- Offline sync support
- Internationalization (English, Hebrew with RTL)

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Backend | Render | `render.yaml` |
| Web App | Vercel | `vercel.json` |
| Database | Supabase | Pooler connection (port 6543) |

### Environment Variables (Backend)

Key variables for production — see `backend/.env.example` for the full list:

- `DATABASE_URL` — Supabase pooler URL
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — RS256 key pair
- `REDIS_URL` — Redis connection (optional, app runs without it)
- `RESEND_API_KEY` — Email delivery
- `PORT` — defaults to 3001

## API Patterns

- CQRS (commands and queries separated)
- Role-based guards (admin, committee_member, owner, tenant)
- Pagination via `?page=1&limit=20`
- Filtering via query params
- ETag caching
- Correlation IDs for request tracing

## Testing

```bash
cd backend
npm test               # unit + property-based tests
```

## Documentation

- [Architecture](backend/docs/ARCHITECTURE.md)
- [API Conventions](backend/docs/API_CONVENTIONS.md)
- [Development Guide](backend/docs/DEVELOPMENT_GUIDE.md)
- [Deployment Guide](backend/docs/DEPLOYMENT_GUIDE.md)
- [Troubleshooting](backend/docs/TROUBLESHOOTING.md)
- [Domain Events](backend/docs/DOMAIN_EVENTS.md)
- [ADRs](backend/docs/adr/)

## License

UNLICENSED — Private project
