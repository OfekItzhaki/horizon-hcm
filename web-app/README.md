# Horizon HCM Web App

React-based web application for the Horizon HCM platform.

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Material-UI (MUI) for components
- React Query for data fetching
- Zustand for state management
- React Router for navigation
- Zod for validation
- Socket.IO client for real-time updates

## Prerequisites

- Node.js >= 20.0.0
- Backend API running on http://localhost:3001

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API URL
```

## Development

Start the development server:
```bash
npm run dev
```

The web app will be available at http://localhost:3000

## Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Testing

Type check:
```bash
npm run type-check
```

Lint code:
```bash
npm run lint
```

## Project Structure

```
web-app/
├── src/
│   ├── components/         ← Reusable components
│   ├── hooks/              ← Custom React hooks
│   ├── i18n/               ← Internationalization
│   ├── layouts/            ← Layout components
│   ├── lib/                ← Library configuration
│   ├── pages/              ← Page components
│   │   ├── admin/          ← Admin pages
│   │   ├── announcements/  ← Announcements
│   │   ├── apartments/     ← Apartments
│   │   ├── auth/           ← Authentication
│   │   ├── buildings/      ← Buildings
│   │   ├── dashboard/      ← Dashboard
│   │   ├── documents/      ← Documents
│   │   ├── invoices/       ← Invoices
│   │   ├── maintenance/    ← Maintenance
│   │   ├── meetings/       ← Meetings
│   │   ├── messages/       ← Messages
│   │   ├── payments/       ← Payments
│   │   ├── polls/          ← Polls
│   │   ├── reports/        ← Reports
│   │   ├── residents/      ← Residents
│   │   └── settings/       ← Settings
│   ├── routes/             ← Route configuration
│   ├── store/              ← Zustand stores
│   ├── theme/              ← MUI theme
│   └── utils/              ← Utility functions
└── public/                 ← Static assets
```

## Features

- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Dark mode support
- ✅ Internationalization (English, Hebrew)
- ✅ Real-time updates via WebSocket
- ✅ Offline support with service worker
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Progressive Web App (PWA)

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

## Deployment

The app can be deployed to:
- Netlify (see `netlify.toml`)
- Vercel (see `vercel.json`)
- Any static hosting service

## License

UNLICENSED - Private project
