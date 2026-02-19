# Quick Start Guide - Horizon-HCM

## 🚀 Get Running in 5 Minutes

### 1. Clone & Install
```bash
git clone https://github.com/OfekItzhaki/horizon-hcm.git
cd horizon-hcm
npm install --legacy-peer-deps
```

### 2. Environment File
The `.env` file is already configured in the repository. Just make sure it exists:
```bash
# Check if .env exists
ls -la .env

# If missing, copy from example
cp .env.example .env
```

### 3. Start Redis
**Windows**: Download from https://github.com/microsoftarchive/redis/releases
**Mac/Linux**: `brew install redis` or `sudo apt-get install redis`
**Docker**: `docker run -d -p 6379:6379 redis`

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Start Development Server
```bash
npm run start:dev
```

### 6. Verify
- API: http://localhost:3001
- Docs: http://localhost:3001/api/docs
- Health: http://localhost:3001/health

## 🔑 Critical Info

### Database (Supabase)
- **URL**: Already in `.env` file
- **Password**: `Kurome@9890` (encoded as `Kurome%409890`)
- **No setup needed** - database is already configured

### Redis
- **Required**: Must be running on localhost:6379
- **Test**: `redis-cli ping` should return `PONG`

### Auth
- **Package**: @ofeklabs/horizon-auth v0.4.1
- **Mode**: Full (standalone)
- **Keys**: Already in `.env` file

## 📁 What's Complete

✅ Infrastructure (100%)
✅ Apartments Module (11 endpoints)
✅ Payments Module (5 endpoints)
✅ Maintenance Module (7 endpoints)
✅ Meetings Module (10 endpoints)
✅ Documents Module (4 endpoints)
✅ Announcements Module (7 endpoints)

## 🎯 Next Tasks

1. **Residents Module** - List, search, profiles, committee management
2. **Financial Reports Module** - Balance, transactions, income/expense reports
3. **Authorization Guards** - Protect endpoints with role-based access
4. **User Context** - Replace placeholder IDs with real auth context
5. **Notification Triggers** - Implement notification sending

## 🛠️ Common Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# View database in browser
npx prisma studio

# Git
git add .
git commit -m "feat: description"
git push origin main
```

## 📚 Documentation

- `HANDOFF.md` - Complete handoff guide
- `docs/IMPLEMENTATION_STATUS.md` - Current status
- `docs/ARCHITECTURE.md` - System architecture
- `docs/ENV_VARIABLES.md` - Environment variables
- `.kiro/specs/core-hcm-features/` - Feature specs

## ⚠️ Troubleshooting

**Build fails**: Run `npx prisma generate`
**Redis error**: Start Redis server
**Database error**: Check `.env` DATABASE_URL
**Auth error**: Verify JWT keys in `.env`

## 🔗 Links

- **GitHub**: https://github.com/OfekItzhaki/horizon-hcm
- **Supabase**: https://supabase.com/dashboard
- **Auth Package**: https://www.npmjs.com/package/@ofeklabs/horizon-auth

---

**Everything is ready to go!** Just clone, install, start Redis, and run `npm run start:dev`.
