# Horizon-HCM Frontend

Multi-platform house committee management application with web and mobile support.

## Architecture

This is a monorepo containing three packages:

- **`packages/web`**: React web application (Vite + TypeScript + Material-UI)
- **`packages/mobile`**: React Native mobile app (Expo + TypeScript + React Native Paper)
- **`packages/shared`**: Shared code (API client, types, utilities)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running on http://localhost:3001

## Getting Started

### Installation

```bash
# Install all dependencies
npm install
```

### Development

```bash
# Run web application (http://localhost:3000)
npm run dev:web

# Run mobile application (Expo)
npm run dev:mobile
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:web
npm run build:mobile
npm run build:shared
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Format all code
npm run format

# Type check all packages
npm run type-check
```

## Environment Variables

Copy `.env.example` to `.env` in each package and configure:

- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:3001)
- `VITE_WS_URL`: WebSocket URL (default: ws://localhost:3001)

See individual package READMEs for package-specific configuration.

## Project Structure

```
horizon-hcm-frontend/
├── packages/
│   ├── web/              # React web application
│   ├── mobile/           # React Native mobile app
│   └── shared/           # Shared code
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # Root TypeScript config
└── package.json          # Root package.json with workspaces
```

## Documentation

- [Web Application](./packages/web/README.md)
- [Mobile Application](./packages/mobile/README.md)
- [Shared Package](./packages/shared/README.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Integration](./docs/API_INTEGRATION.md)

## Tech Stack

### Web

- React 18
- TypeScript
- Vite
- Material-UI v5
- React Router v6
- Zustand + React Query
- Socket.io-client

### Mobile

- React Native
- TypeScript
- Expo
- React Native Paper
- React Navigation v6
- Zustand + React Query
- Socket.io-client

### Shared

- TypeScript
- Axios
- Zod
- date-fns

## License

Proprietary - All rights reserved
