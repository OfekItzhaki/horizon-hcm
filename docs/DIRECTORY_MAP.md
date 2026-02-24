# Directory Map - Visual Guide

## 🗺️ Where Everything Lives

```
horizon-hcm/                                    ← 📍 BACKEND ROOT (You are here!)
│
├── 📂 src/                                     ← Backend Source Code (NestJS)
│   ├── announcements/                          ← Announcements module
│   ├── apartments/                             ← Apartments module
│   ├── buildings/                              ← Buildings module
│   ├── common/                                 ← Shared utilities
│   ├── invoices/                               ← Invoices module ✨ NEW
│   ├── maintenance/                            ← Maintenance requests
│   ├── meetings/                               ← Meetings module
│   ├── messages/                               ← Messages module ✨ NEW
│   ├── notifications/                          ← Push notifications
│   ├── polls/                                  ← Polls module ✨ NEW
│   ├── residents/                              ← Residents module
│   ├── users/                                  ← Users module
│   ├── app.module.ts                           ← Root module
│   └── main.ts                                 ← Entry point
│
├── 📂 prisma/                                  ← Database
│   ├── migrations/                             ← Database migrations
│   │   ├── 20260224015100_add_read_at_and_theme_fields/
│   │   ├── 20260224020000_add_polls_table/
│   │   ├── 20260224004638_add_messages_table/
│   │   └── 20260224005336_add_invoices_table/
│   └── schema.prisma                           ← Database schema
│
├── 📂 docs/                                    ← Backend Documentation
│   ├── PROJECT_STRUCTURE.md                    ← Complete structure guide
│   ├── ARCHITECTURE.md                         ← System architecture
│   ├── DEPLOYMENT.md                           ← Deployment guide
│   ├── FCM_SETUP_GUIDE.md                      ← Push notifications (backend)
│   ├── ENV_VARIABLES.md                        ← Environment variables
│   └── IMPLEMENTATION_SUMMARY.md               ← Recent changes
│
├── 📂 horizon-hcm-frontend/                    ← 🎨 FRONTEND ROOT (Separate!)
│   │
│   ├── 📂 packages/                            ← Frontend packages
│   │   │
│   │   ├── 📂 web/                             ← Web App (React + Vite)
│   │   │   ├── src/
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   ├── hooks/
│   │   │   │   └── utils/
│   │   │   ├── package.json
│   │   │   └── vite.config.ts
│   │   │
│   │   ├── 📂 mobile/                          ← Mobile App (Expo/React Native)
│   │   │   ├── src/
│   │   │   │   ├── components/
│   │   │   │   ├── screens/
│   │   │   │   ├── navigation/
│   │   │   │   └── utils/
│   │   │   ├── google-services.json            ← 🔥 Mobile FCM credentials
│   │   │   ├── app.json                        ← Expo config
│   │   │   ├── package.json
│   │   │   └── PUSH_NOTIFICATIONS_SETUP.md     ← Mobile push setup
│   │   │
│   │   └── 📂 shared/                          ← Shared Code
│   │       ├── src/
│   │       │   ├── api/                        ← API client
│   │       │   ├── types/                      ← TypeScript types
│   │       │   ├── store/                      ← State management
│   │       │   └── utils/                      ← Utilities
│   │       └── package.json
│   │
│   ├── ARCHITECTURE.md                         ← Frontend architecture
│   ├── DEPLOYMENT.md                           ← Frontend deployment
│   └── package.json                            ← Frontend workspace
│
├── 📂 node_modules/                            ← Backend dependencies
├── 📂 dist/                                    ← Backend build output
├── 📂 logs/                                    ← Application logs
├── 📂 scripts/                                 ← Utility scripts
│
├── 📄 .env                                     ← Environment variables (gitignored)
├── 📄 .env.example                             ← Environment template
├── 📄 firebase-service-account.json            ← 🔥 Backend FCM credentials (gitignored)
├── 📄 package.json                             ← Backend dependencies
├── 📄 tsconfig.json                            ← TypeScript config
├── 📄 nest-cli.json                            ← NestJS config
├── 📄 README.md                                ← Main readme
├── 📄 QUICK_REFERENCE.md                       ← Quick reference
└── 📄 docker-compose.yml                       ← Docker services
```

## 🎯 Key Locations

### Backend (Root Directory)

| What You Need | Where It Is |
|---------------|-------------|
| API source code | `src/` |
| Database schema | `prisma/schema.prisma` |
| Database migrations | `prisma/migrations/` |
| Environment config | `.env` |
| Backend FCM credentials | `firebase-service-account.json` |
| Backend documentation | `docs/` |
| Backend dependencies | `package.json` |

### Frontend (horizon-hcm-frontend/)

| What You Need | Where It Is |
|---------------|-------------|
| Web app | `packages/web/` |
| Mobile app | `packages/mobile/` |
| Shared code | `packages/shared/` |
| Mobile FCM credentials | `packages/mobile/google-services.json` |
| Frontend documentation | `ARCHITECTURE.md`, `DEPLOYMENT.md` |

## 🔥 Firebase Files (CRITICAL!)

### Two Different Files - Don't Mix Them Up!

```
Backend (Root)                          Mobile (packages/mobile/)
├── firebase-service-account.json       ├── google-services.json
│   ├── "type": "service_account"       │   ├── "project_info": {...}
│   ├── "private_key": "-----BEGIN"     │   ├── "client": [...]
│   └── "client_email": "firebase-..."  │   └── "api_key": [...]
│                                       │
│   Used to SEND notifications          │   Used to RECEIVE notifications
│   Download from: Service Accounts     │   Download from: General → Your apps
```

## 📊 Module Structure (CQRS Pattern)

Every feature module in `src/` follows this structure:

```
src/module-name/
├── commands/                           ← Write Operations
│   ├── handlers/
│   │   ├── create-*.handler.ts         ← Create logic
│   │   ├── update-*.handler.ts         ← Update logic
│   │   └── delete-*.handler.ts         ← Delete logic
│   └── impl/
│       ├── create-*.command.ts         ← Create command
│       ├── update-*.command.ts         ← Update command
│       └── delete-*.command.ts         ← Delete command
│
├── queries/                            ← Read Operations
│   ├── handlers/
│   │   ├── get-*.handler.ts            ← Get single
│   │   └── list-*.handler.ts           ← Get list
│   └── impl/
│       ├── get-*.query.ts              ← Get query
│       └── list-*.query.ts             ← List query
│
├── dto/                                ← Data Validation
│   ├── create-*.dto.ts                 ← Create validation
│   ├── update-*.dto.ts                 ← Update validation
│   └── *.dto.ts                        ← Other DTOs
│
├── module-name.controller.ts           ← REST API Endpoints
├── module-name.module.ts               ← Module Definition
└── module-name.service.ts              ← Business Logic (optional)
```

## 🚀 Running Services

### Backend (from root directory)
```bash
npm run start:dev
# → http://localhost:3001
# → http://localhost:3001/api/docs (Swagger)
```

### Frontend Web (from horizon-hcm-frontend/packages/web/)
```bash
npm run dev
# → http://localhost:3000
```

### Frontend Mobile (from horizon-hcm-frontend/packages/mobile/)
```bash
npm start
# → Expo DevTools on port 8081
```

## 🗄️ Database

### Prisma Commands (from root directory)
```bash
npx prisma migrate deploy    # Apply migrations
npx prisma generate          # Generate client
npx prisma studio            # Open GUI (http://localhost:5555)
```

### Recent Schema Changes
```
✅ notification_logs.read_at (TIMESTAMP)
✅ user_profiles.theme (TEXT)
✅ polls table (id, building_id, title, options, etc.)
✅ poll_votes table (id, poll_id, user_id, option_ids)
✅ messages table (id, building_id, sender_id, recipient_id, content)
✅ invoices table (id, building_id, apartment_id, amount, status)
```

## 📦 Dependencies

### Backend (Root)
```bash
npm install                  # Install backend deps
npm run build                # Build backend
npm test                     # Run backend tests
```

### Frontend (horizon-hcm-frontend/)
```bash
cd horizon-hcm-frontend
npm install                  # Install all frontend deps (web + mobile + shared)
```

## 🔍 Finding Things

### "Where is the X module?"
- Backend modules: `src/X/`
- Frontend web pages: `horizon-hcm-frontend/packages/web/src/pages/`
- Frontend mobile screens: `horizon-hcm-frontend/packages/mobile/src/screens/`

### "Where is the database schema?"
- Schema definition: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

### "Where is the documentation?"
- Backend docs: `docs/`
- Frontend docs: `horizon-hcm-frontend/`
- Quick reference: `QUICK_REFERENCE.md`

### "Where are the tests?"
- Backend tests: `src/**/__tests__/`
- Frontend tests: `horizon-hcm-frontend/packages/shared/src/**/*.test.ts`

## 🎨 Code Organization

### File Size Guidelines
✅ All files follow these guidelines:
- Controllers: < 400 lines
- Services: < 400 lines  
- Handlers: < 100 lines
- DTOs: < 50 lines

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

## 🆘 Lost?

1. **Backend work?** → You're in the right place (root directory)
2. **Frontend work?** → Go to `horizon-hcm-frontend/`
3. **Database work?** → Use `prisma/` directory
4. **Documentation?** → Check `docs/` directory
5. **Still lost?** → Read `QUICK_REFERENCE.md`
