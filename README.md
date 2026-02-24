# Horizon HCM - House Committee Management Platform

A comprehensive mobile-first SaaS platform for residential building management with web and mobile applications.

## 📁 Project Structure

This is a **monorepo** containing:

```
horizon-hcm/                          ← YOU ARE HERE (Backend API)
├── src/                              ← Backend source code (NestJS)
├── prisma/                           ← Database schema & migrations
├── docs/                             ← Backend documentation
├── package.json                      ← Backend dependencies
└── horizon-hcm-frontend/             ← Frontend applications
    ├── packages/web/                 ← Web app (React + Vite)
    ├── packages/mobile/              ← Mobile app (Expo/React Native)
    └── packages/shared/              ← Shared code (API client, types)
```

**Important**: 
- **Backend (this directory)**: NestJS API server
- **Frontend**: Located in `horizon-hcm-frontend/` subdirectory

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for detailed structure.

## 🚀 Quick Start

### Backend (API Server)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run start:dev
```

Backend will run on: http://localhost:3001

### Frontend

See `horizon-hcm-frontend/README.md` for frontend setup instructions.

## 🛠️ Tech Stack

### Backend
- **NestJS** - TypeScript framework with CQRS pattern
- **PostgreSQL** - Database (Supabase)
- **Redis** - Caching and queues
- **Prisma** - ORM
- **Firebase Admin** - Push notifications (FCM)
- **@ofeklabs/horizon-auth** - Authentication

### Frontend
- **React** - Web UI framework
- **React Native** - Mobile framework (Expo)
- **Vite** - Web build tool
- **Zustand** - State management
- **React Query** - Data fetching
- **Zod** - Validation

## 📚 Documentation

### Backend Documentation (`docs/`)
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Complete project organization guide
- [Architecture](docs/ARCHITECTURE.md) - System architecture and design patterns
- [Deployment](docs/DEPLOYMENT.md) - Deployment guide and procedures
- [FCM Setup](docs/FCM_SETUP_GUIDE.md) - Push notifications setup (backend)
- [Environment Variables](docs/ENV_VARIABLES.md) - Configuration reference
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Recent implementation details
- [API Changelog](docs/CHANGELOG.md) - API version history

### Frontend Documentation (`horizon-hcm-frontend/`)
- [Frontend Architecture](horizon-hcm-frontend/ARCHITECTURE.md)
- [Frontend Deployment](horizon-hcm-frontend/DEPLOYMENT.md)
- [Mobile Push Notifications](horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md)

## 🔌 API Documentation

Swagger UI available at: http://localhost:3001/api/docs

## 🏗️ Architecture

### Backend Modules (CQRS Pattern)

All feature modules follow the CQRS (Command Query Responsibility Segregation) pattern:

```
src/
├── announcements/      ← Building announcements
├── apartments/         ← Apartment management
├── buildings/          ← Building management
├── invoices/           ← Invoice management ✨ NEW
├── maintenance/        ← Maintenance requests
├── meetings/           ← Meeting management
├── messages/           ← Direct messaging ✨ NEW
├── notifications/      ← Push notifications
├── polls/              ← Voting/polls ✨ NEW
├── residents/          ← Resident management
├── users/              ← User management
└── ...
```

Each module contains:
- `commands/` - Write operations (create, update, delete)
- `queries/` - Read operations (get, list)
- `dto/` - Data validation
- `*.controller.ts` - REST API endpoints
- `*.module.ts` - Module definition

## 🔥 Recent Updates

### ✅ Completed Features
- Database schema updates (read_at, theme fields)
- Polls API with CQRS pattern
- Messages API with CQRS pattern
- Invoices API with CQRS pattern
- Push notifications integration (FCM)
- Mobile app FCM configuration

### 🚧 In Progress
- Firebase service account setup for backend
- Notification templates creation
- End-to-end push notification testing

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run property-based tests
npm test -- --testPathPattern=properties
```

All 136 property-based tests passing ✅

## 🗄️ Database

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Recent Schema Changes
- Added `read_at` field to `notification_logs`
- Added `theme` field to `user_profiles`
- Created `polls` and `poll_votes` tables
- Created `messages` table
- Created `invoices` table

## 🔐 Security

### Firebase Credentials

**Two different files required**:

1. **Backend**: `firebase-service-account.json` (root directory)
   - Used to SEND push notifications
   - Download from: Firebase Console → Service Accounts → Generate new private key
   - ⚠️ Gitignored - never commit!

2. **Mobile**: `google-services.json` (mobile app directory)
   - Used to RECEIVE push notifications
   - Download from: Firebase Console → General → Your apps
   - ⚠️ Gitignored - never commit!

See [docs/FCM_SETUP_GUIDE.md](docs/FCM_SETUP_GUIDE.md) for setup instructions.

## 🌐 Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| Swagger Docs | 3001 | http://localhost:3001/api/docs |
| Web App | 3000 | http://localhost:3000 |
| Mobile App | 8081 | Expo DevTools |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

## 📦 Scripts

```bash
# Development
npm run start:dev        # Start with hot reload
npm run start:debug      # Start with debugger

# Production
npm run build            # Build for production
npm run start:prod       # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
npm test                 # Run tests
```

## 🤝 Contributing

1. Follow the CQRS pattern for new features
2. Write property-based tests for business logic
3. Use Prettier and ESLint for code formatting
4. Update documentation when adding features

## 📄 License

UNLICENSED - Private project

## 🆘 Troubleshooting

### "Where is the backend?"
The root directory IS the backend. Frontend is in `horizon-hcm-frontend/`.

### "FCM not working"
Check you have both Firebase files:
- Backend: `firebase-service-account.json` (root)
- Mobile: `google-services.json` (mobile app)

### "Module not found"
```bash
# Backend
npm install

# Frontend
cd horizon-hcm-frontend
npm install
```

### "Database connection failed"
Check `.env` file has correct `DATABASE_URL` for Supabase.

## 📞 Support

For issues and questions, see documentation in `docs/` directory.
