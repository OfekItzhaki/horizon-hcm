# Horizon-HCM

A mobile-first SaaS platform for residential building management.

## Documentation

All documentation is located in the `docs/` folder:

- [Architecture](docs/ARCHITECTURE.md) - System architecture and design
- [Deployment](docs/DEPLOYMENT.md) - Deployment guide and procedures
- [API Changelog](docs/CHANGELOG.md) - API version history and changes
- [Environment Variables](docs/ENV_VARIABLES.md) - Configuration reference
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md) - Current project status

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

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

## Tech Stack

- **NestJS** - TypeScript framework
- **PostgreSQL** - Database (Supabase)
- **Redis** - Caching and queues
- **Prisma** - ORM
- **@ofeklabs/horizon-auth** - Authentication

## API Documentation

Swagger UI available at: `http://localhost:3001/api/docs`

## Project Status

- ✅ Infrastructure: 100% complete
- ✅ Core Business Features: 30% complete
- 🚧 Remaining modules in progress

See [Implementation Status](docs/IMPLEMENTATION_STATUS.md) for details.
