# Horizon HCM Backend

NestJS-based backend API for the Horizon HCM platform.

## Tech Stack

- NestJS with TypeScript
- PostgreSQL (Supabase)
- Prisma ORM
- Redis for caching
- Firebase Cloud Messaging
- CQRS pattern with @nestjs/cqrs
- BullMQ for job queues
- Socket.IO for real-time updates

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database
- Redis server
- Firebase Admin SDK credentials (for push notifications)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run migrations:
```bash
npx prisma migrate deploy
```

5. Seed notification templates:
```bash
node scripts/seed-notification-templates.js
```

## Development

Start the development server:
```bash
npm run start:dev
```

The API will be available at http://localhost:3001

API documentation (Swagger): http://localhost:3001/api/docs

## Testing

Run tests:
```bash
npm test
```

Run property-based tests:
```bash
npm test -- --testPathPattern=properties
```

## Database

View database in Prisma Studio:
```bash
npx prisma studio
```

Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

## Scripts

- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run setup` - Initial setup script

## Project Structure

```
backend/
├── src/
│   ├── announcements/      ← Announcements module
│   ├── apartments/         ← Apartments module
│   ├── buildings/          ← Buildings module
│   ├── common/             ← Shared utilities
│   ├── documents/          ← Documents module
│   ├── files/              ← File storage module
│   ├── health/             ← Health check
│   ├── invoices/           ← Invoices module
│   ├── maintenance/        ← Maintenance requests
│   ├── meetings/           ← Meetings & voting
│   ├── messages/           ← Direct messaging
│   ├── notifications/      ← Push notifications
│   ├── payments/           ← Payments module
│   ├── polls/              ← Polls system
│   ├── realtime/           ← WebSocket gateway
│   ├── reports/            ← Financial reports
│   ├── residents/          ← Residents management
│   ├── sync/               ← Offline sync
│   ├── users/              ← User management
│   └── webhooks/           ← Webhook handlers
├── prisma/
│   ├── schema.prisma       ← Database schema
│   └── migrations/         ← Database migrations
└── scripts/                ← Utility scripts
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` / `REDIS_PORT` - Redis configuration
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` - JWT signing keys
- `FCM_SERVICE_ACCOUNT_PATH` - Firebase credentials path
- `FRONTEND_URL` - Frontend URL for CORS

## License

UNLICENSED - Private project
