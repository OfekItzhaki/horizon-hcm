# Horizon-HCM

Modern, transparent management platform for residential house committees, owners, and tenants.

**Primary Platform**: Native mobile apps (Android + iOS)  
**Secondary Platform**: Web application  
**Architecture**: CQRS + Clean Architecture following The Horizon Standard

## 🎯 Description

Horizon-HCM is a premium SaaS platform with native mobile apps and web support that centralizes building management:
- Building data (units, owners, tenants, public areas)
- House committee fees and one-time charges
- Online payments and invoices
- Announcements, discussions, and voting
- Transparency of expenses and building balance
- Real-time notifications and updates

## 🏗️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Architecture**: CQRS (Command Query Responsibility Segregation)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: @ofeklabs/horizon-auth (2FA, device management, social login)
- **Session Management**: Redis
- **Security**: RSA JWT tokens, Helmet.js, Rate limiting
- **Background Jobs**: BullMQ
- **Logging**: Winston (structured JSON logging)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Log Aggregation**: Seq (optional)
- **Caching**: Redis
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
git clone https://github.com/OfekItzhaki/horizon-hcm.git
cd horizon-hcm
npm install
```

### 2. Initial Setup

```bash
# Run automated setup (generates JWT keys, creates .env, generates Prisma clients)
npm run setup
```

### 3. Configure Environment

Update `.env` with your configuration (already set for Full mode):

```env
# Authentication Mode
AUTH_MODE=full

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/horizon_hcm"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Application
PORT=3001
NODE_ENV="development"
COOKIE_DOMAIN=".horizon-hcm.com"
FRONTEND_URL="http://localhost:3000"

# Feature Flags
ENABLE_2FA=true
ENABLE_DEVICE_MGMT=true
ENABLE_PUSH=true
ENABLE_ACCOUNT_MGMT=true

# Logging
LOG_LEVEL="info"
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Seq using Docker Compose
npm run dev:start
```

This will:
- ✅ Start PostgreSQL on port 5432
- ✅ Start Redis on port 6379
- ✅ Start Seq (logs) on port 5341
- ✅ Wait for all services to be healthy

### 5. Run Database Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Apply Horizon-HCM migrations (includes auth tables)
npm run prisma:migrate
```

---### 6. Start the Application

```bash
# Development mode with hot reload
npm run start:dev
```

### 7. Access the Application

- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs
- **Seq Logs**: http://localhost:5341

## 📚 API Documentation

### Authentication Mode

The application is configured for **Full Mode (Standalone)**, which means:
- Authentication is embedded in the application
- All auth features (2FA, device management, etc.) are available locally
- User data is stored in the local database
- JWT tokens are signed and verified locally

For SSO mode configuration, see `SSO_SETUP_GUIDE.md`.

---

### Swagger/OpenAPI

Interactive API documentation is available at `/api/docs` when the application is running.

### Authentication Endpoints

All authentication endpoints are provided by `@ofeklabs/horizon-auth` at `/auth`:

**Registration & Login:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh access token

**Two-Factor Authentication:**
- `POST /auth/2fa/enable` - Enable 2FA
- `POST /auth/2fa/disable` - Disable 2FA
- `POST /auth/2fa/verify` - Verify 2FA code
- `GET /auth/2fa/qr` - Get QR code for 2FA setup

**Device Management:**
- `GET /auth/devices` - List user's devices
- `DELETE /auth/devices/:id` - Remove a device
- `PUT /auth/devices/:id/name` - Rename a device

**Account Management:**
- `POST /auth/account/deactivate` - Deactivate account
- `POST /auth/account/reactivate` - Reactivate account
- `DELETE /auth/account` - Delete account permanently

**Push Notifications:**
- `POST /auth/push/register` - Register push token
- `DELETE /auth/push/unregister` - Unregister push token

### Building Management Endpoints

**Buildings:**
- `POST /buildings` - Create a new building (CQRS Command)
- `GET /buildings/:id` - Get building by ID (CQRS Query)
- `GET /buildings` - List all buildings (CQRS Query)
- `PATCH /buildings/:id` - Update building (CQRS Command)
- `DELETE /buildings/:id` - Delete building (CQRS Command)

## 🏗️ Project Structure (CQRS + Clean Architecture)

```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
│
├── common/                      # Shared utilities
│   ├── filters/                 # Exception filters
│   ├── interceptors/            # Logging, transform interceptors
│   ├── guards/                  # Auth guards
│   └── logger/                  # Winston logger service
│
├── prisma/                      # Prisma service
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── buildings/                   # Building module (CQRS)
│   ├── commands/                # Write operations
│   │   ├── impl/                # Command definitions
│   │   └── handlers/            # Command handlers
│   ├── queries/                 # Read operations
│   │   ├── impl/                # Query definitions
│   │   └── handlers/            # Query handlers
│   ├── dto/                     # Data transfer objects
│   ├── buildings.controller.ts # HTTP endpoints
│   └── buildings.module.ts     # Module definition
│
└── [other modules follow same pattern]
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🔒 Security Features

- ✅ RSA JWT tokens (2048-bit keys)
- ✅ Secure session management with Redis
- ✅ Two-factor authentication
- ✅ Device tracking and management
- ✅ Rate limiting (100 requests/minute per IP)
- ✅ Security headers (Helmet.js)
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Cookie security (httpOnly, secure, sameSite)

## 📊 Observability

### Structured Logging

All logs are structured in JSON format with contextual information:

```json
{
  "timestamp": "2026-02-18T16:00:00.000Z",
  "level": "info",
  "message": "Request Completed",
  "context": "HTTP",
  "method": "POST",
  "url": "/buildings",
  "statusCode": 201,
  "responseTime": "45ms"
}
```

### Log Aggregation

Logs are stored in:
- **Console**: Colorized output for development
- **Files**: Daily rotating files in `logs/` directory
- **Seq**: Centralized log aggregation (http://localhost:5341)

### Health Checks

- `GET /health` - Application health status
- `GET /health/ready` - Readiness probe

## 🚢 Deployment

### Docker Production Build

```bash
# Build production image
docker build -t horizon-hcm:latest .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
REDIS_HOST=<production-redis-host>
JWT_SECRET=<strong-secret-key>
COOKIE_DOMAIN=.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## 🛠️ Development Workflow

### Pre-commit Hooks

Husky and lint-staged automatically run on every commit:
- ✅ Prettier formatting
- ✅ ESLint linting and auto-fix
- ✅ Type checking

### Conventional Commits

Follow the conventional commit format:

```bash
feat(buildings): add building creation endpoint
fix(auth): resolve token expiration issue
chore(deps): update dependencies
docs(readme): add deployment instructions
```

### Code Quality Checklist

Before committing:
- ✅ No `any` types in TypeScript
- ✅ All tests passing
- ✅ Linting passes with 0 errors
- ✅ Code formatted with Prettier
- ✅ Proper error handling
- ✅ API documented in Swagger

## 📖 Architecture Decisions

This project follows **The Horizon Standard** - a universal set of architectural principles:

1. **CQRS Pattern**: Commands (write) and Queries (read) are separated
2. **Single Source of Truth**: OpenAPI/Swagger for API contracts
3. **Standardized Error Handling**: Global exception filter
4. **Container-First**: Docker Compose for all services
5. **Background Jobs**: BullMQ for async operations
6. **Structured Logging**: Winston with JSON format
7. **Observability**: Seq for log aggregation
8. **Security First**: Multiple layers of security
9. **Mobile-First**: Optimized for mobile consumption
10. **Code Quality**: Automated checks and standards

## 🎯 Roadmap

### ✅ Phase 1: Foundation (Complete)
- Enterprise-grade authentication (2FA, device management)
- CQRS architecture
- Structured logging
- Docker Compose setup
- API documentation (Swagger)
- Building management (basic CQRS example)

### 🚧 Phase 2: Core Features (In Progress)
- Apartment management
- User profile management
- Committee member assignment
- Tenant/owner relationships

### 📋 Phase 3: Payment System
- Payment definitions (recurring/one-time)
- Invoice generation
- Payment processing
- Financial reports

### 📋 Phase 4: Communication
- Announcements
- Real-time notifications (Socket.IO)
- Chat system
- Polls and voting

### 📋 Phase 5: Premium Features
- Advanced analytics
- Document management
- Calendar integration
- Mobile apps (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

UNLICENSED

---

**Built with ❤️ following The Horizon Standard**
