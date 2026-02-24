# 📖 Horizon HCM - Documentation Index

Welcome! This is your starting point for navigating the Horizon HCM project.

## 🎯 Start Here

### New to the Project?
1. Read [README.md](README.md) - Project overview
2. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common tasks
3. View [docs/DIRECTORY_MAP.md](docs/DIRECTORY_MAP.md) - Visual guide

### Need Something Specific?
Use the quick links below to jump to what you need.

## 🗂️ Documentation Categories

### 📍 Getting Started
| Document | Description |
|----------|-------------|
| [README.md](README.md) | Main project overview and quick start |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick reference for common tasks |
| [docs/DIRECTORY_MAP.md](docs/DIRECTORY_MAP.md) | Visual directory structure guide |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Complete project structure explanation |

### 🏗️ Architecture & Design
| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Backend system architecture |
| [horizon-hcm-frontend/ARCHITECTURE.md](horizon-hcm-frontend/ARCHITECTURE.md) | Frontend architecture |
| [docs/ORGANIZATION_SUMMARY.md](docs/ORGANIZATION_SUMMARY.md) | Project organization details |

### 🚀 Deployment & Operations
| Document | Description |
|----------|-------------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Backend deployment guide |
| [horizon-hcm-frontend/DEPLOYMENT.md](horizon-hcm-frontend/DEPLOYMENT.md) | Frontend deployment guide |
| [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) | Environment variables reference |

### 🔔 Push Notifications
| Document | Description |
|----------|-------------|
| [docs/FCM_SETUP_GUIDE.md](docs/FCM_SETUP_GUIDE.md) | Backend FCM setup (sending notifications) |
| [horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md](horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md) | Mobile FCM setup (receiving notifications) |

### 📝 Implementation Details
| Document | Description |
|----------|-------------|
| [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) | Recent implementation details |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | API version history |
| [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | Current project status |

## 🎨 By Role

### Backend Developer
1. [README.md](README.md) - Project overview
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Backend architecture
3. [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Code organization
4. [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Configuration
5. [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment

### Frontend Developer
1. [horizon-hcm-frontend/README.md](horizon-hcm-frontend/README.md) - Frontend overview
2. [horizon-hcm-frontend/ARCHITECTURE.md](horizon-hcm-frontend/ARCHITECTURE.md) - Frontend architecture
3. [horizon-hcm-frontend/DEPLOYMENT.md](horizon-hcm-frontend/DEPLOYMENT.md) - Frontend deployment

### Mobile Developer
1. [horizon-hcm-frontend/packages/mobile/README.md](horizon-hcm-frontend/packages/mobile/README.md) - Mobile app overview
2. [horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md](horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md) - Push notifications
3. [horizon-hcm-frontend/packages/mobile/DEPLOYMENT_GUIDE.md](horizon-hcm-frontend/packages/mobile/DEPLOYMENT_GUIDE.md) - Mobile deployment

### DevOps Engineer
1. [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Backend deployment
2. [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Environment configuration
3. [docker-compose.yml](docker-compose.yml) - Docker services
4. [docs/FCM_SETUP_GUIDE.md](docs/FCM_SETUP_GUIDE.md) - FCM setup

## 🔍 By Task

### Setting Up Development Environment
1. [README.md](README.md) - Quick start
2. [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Environment setup
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common commands

### Understanding the Codebase
1. [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Structure overview
2. [docs/DIRECTORY_MAP.md](docs/DIRECTORY_MAP.md) - Visual guide
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture patterns

### Implementing New Features
1. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - CQRS pattern
2. [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Module structure
3. [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - Recent examples

### Deploying to Production
1. [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Backend deployment
2. [horizon-hcm-frontend/DEPLOYMENT.md](horizon-hcm-frontend/DEPLOYMENT.md) - Frontend deployment
3. [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Production config

### Setting Up Push Notifications
1. [docs/FCM_SETUP_GUIDE.md](docs/FCM_SETUP_GUIDE.md) - Backend setup
2. [horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md](horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md) - Mobile setup

### Troubleshooting
1. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common issues
2. [docs/FCM_SETUP_GUIDE.md](docs/FCM_SETUP_GUIDE.md) - FCM troubleshooting
3. [horizon-hcm-frontend/TROUBLESHOOTING.md](horizon-hcm-frontend/TROUBLESHOOTING.md) - Frontend issues

## 📂 Project Structure Quick View

```
horizon-hcm/                          ← Backend (NestJS)
├── src/                              ← Backend source code
├── prisma/                           ← Database
├── docs/                             ← Backend documentation
├── horizon-hcm-frontend/             ← Frontend (React monorepo)
│   ├── packages/web/                 ← Web app
│   ├── packages/mobile/              ← Mobile app
│   └── packages/shared/              ← Shared code
├── README.md                         ← Start here
├── QUICK_REFERENCE.md                ← Quick reference
└── INDEX.md                          ← This file
```

## 🔗 External Resources

### API Documentation
- Swagger UI: http://localhost:3001/api/docs (when running)

### Database
- Prisma Studio: http://localhost:5555 (run `npx prisma studio`)

### Services
- Backend API: http://localhost:3001
- Web App: http://localhost:3000
- Mobile App: Expo DevTools on port 8081

## 🆘 Still Lost?

### Can't Find Something?
1. Check [docs/DIRECTORY_MAP.md](docs/DIRECTORY_MAP.md) for visual guide
2. Use search in your editor (Ctrl+Shift+F / Cmd+Shift+F)
3. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common locations

### Need Help with a Task?
1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common tasks
2. Look in the "By Task" section above
3. Check the troubleshooting sections in relevant docs

### Want to Understand the Architecture?
1. Start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Review [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
3. Look at example modules in `src/`

## 📊 Documentation Status

| Category | Status | Last Updated |
|----------|--------|--------------|
| Project Structure | ✅ Complete | 2026-02-24 |
| Backend Architecture | ✅ Complete | 2026-02-24 |
| Frontend Architecture | ✅ Complete | 2026-02-24 |
| Deployment Guides | ✅ Complete | 2026-02-24 |
| FCM Setup | ✅ Complete | 2026-02-24 |
| Environment Variables | ✅ Complete | 2026-02-24 |
| Quick Reference | ✅ Complete | 2026-02-24 |

## 🎯 Quick Links

### Most Used Documents
- [README.md](README.md) - Project overview
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference
- [docs/DIRECTORY_MAP.md](docs/DIRECTORY_MAP.md) - Visual guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture

### Setup Guides
- [docs/FCM_SETUP_GUIDE.md](docs/FCM_SETUP_GUIDE.md) - Push notifications (backend)
- [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) - Environment setup
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment

### Reference
- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Complete structure
- [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - Recent changes
- [docs/ORGANIZATION_SUMMARY.md](docs/ORGANIZATION_SUMMARY.md) - Organization details

---

**Last Updated**: 2026-02-24  
**Version**: 1.0.0  
**Maintained By**: Development Team
