# Horizon HCM - House Committee Management Platform

A comprehensive platform for residential building management with backend API, web application, and mobile application.

## 📁 Project Structure

```
horizon-hcm/
├── backend/                    ← Backend API (NestJS)
├── mobile-app/                 ← Mobile app (Expo/React Native)
├── web-app/                    ← Web app (React + Vite)
├── shared/                     ← Shared code (API client, types, utils)
├── docs/                       ← Project documentation
└── .github/                    ← CI/CD workflows
```

## 🚀 Quick Start

### Backend API

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Backend runs on: http://localhost:3001

### Web App

```bash
cd web-app
npm install
npm run dev
```

Web app runs on: http://localhost:3000

### Mobile App

```bash
cd mobile-app
npm install
npm start
```

Mobile app runs with Expo DevTools

## 📚 Documentation

- [Backend Documentation](backend/README.md)
- [Web App Documentation](web-app/README.md)
- [Mobile App Documentation](mobile-app/README.md)
- [Shared Package Documentation](shared/README.md)
- [Project Documentation](docs/)

## 🛠️ Tech Stack

### Backend
- NestJS with TypeScript
- PostgreSQL (Supabase)
- Prisma ORM
- Redis for caching
- Firebase Cloud Messaging
- CQRS pattern

### Frontend
- React (Web) / React Native (Mobile)
- TypeScript
- Zustand for state management
- React Query for data fetching
- Zod for validation

## 🔥 Features

- ✅ User authentication & authorization
- ✅ Building & apartment management
- ✅ Announcements & notifications
- ✅ Maintenance requests
- ✅ Meetings & voting
- ✅ Polls system
- ✅ Direct messaging
- ✅ Invoice management
- ✅ Push notifications (FCM)
- ✅ Real-time updates (WebSocket)
- ✅ Offline sync support

## 📦 Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| API Docs (Swagger) | 3001 | http://localhost:3001/api/docs |
| Web App | 3000 | http://localhost:3000 |
| Mobile App | 8081 | Expo DevTools |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd shared
npm test
```

## 📄 License

UNLICENSED - Private project

## 🆘 Support

See documentation in each package's README for detailed setup and troubleshooting.
