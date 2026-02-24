# Horizon HCM Mobile App

React Native mobile application for the Horizon HCM platform, built with Expo.

## Tech Stack

- React Native with TypeScript
- Expo SDK 54
- React Navigation for routing
- React Native Paper for UI components
- React Query for data fetching
- Zustand for state management
- Zod for validation
- Socket.IO client for real-time updates
- Expo Notifications for push notifications

## Prerequisites

- Node.js >= 20.0.0
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Backend API running on http://localhost:3001

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase (for push notifications):
   - Place `google-services.json` in the root directory
   - See `PUSH_NOTIFICATIONS_SETUP.md` for detailed instructions

## Development

Start the development server:
```bash
npm start
```

Run on Android:
```bash
npm run android
```

Run on iOS:
```bash
npm run ios
```

## Building

Build for Android:
```bash
eas build --platform android
```

Build for iOS:
```bash
eas build --platform ios
```

See `DEPLOYMENT_GUIDE.md` for detailed build instructions.

## Testing

Type check:
```bash
npm run type-check
```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/         ← Reusable components
│   ├── hooks/              ← Custom React hooks
│   ├── navigation/         ← Navigation configuration
│   ├── screens/            ← Screen components
│   │   ├── announcements/  ← Announcements
│   │   ├── apartments/     ← Apartments
│   │   ├── auth/           ← Authentication
│   │   ├── buildings/      ← Buildings
│   │   ├── chat/           ← Chat/Messages
│   │   ├── dashboard/      ← Dashboard
│   │   ├── documents/      ← Documents
│   │   ├── invoices/       ← Invoices
│   │   ├── maintenance/    ← Maintenance
│   │   ├── meetings/       ← Meetings
│   │   ├── notifications/  ← Notifications
│   │   ├── payments/       ← Payments
│   │   ├── polls/          ← Polls
│   │   ├── profile/        ← User profile
│   │   ├── reports/        ← Reports
│   │   ├── residents/      ← Residents
│   │   └── settings/       ← Settings
│   ├── theme/              ← Theme configuration
│   ├── types/              ← TypeScript types
│   └── utils/              ← Utility functions
└── assets/                 ← Images and fonts
```

## Features

- ✅ Native iOS and Android support
- ✅ Push notifications (FCM)
- ✅ Biometric authentication
- ✅ Camera integration
- ✅ Document picker
- ✅ Real-time updates via WebSocket
- ✅ Offline support
- ✅ Dark mode support

## Push Notifications Setup

1. Configure Firebase:
   - Create a Firebase project
   - Download `google-services.json`
   - Place it in the mobile-app root directory

2. Update `app.json`:
   - Set correct package name
   - Configure `googleServicesFile` path

3. Test notifications:
   - See `PUSH_NOTIFICATIONS_SETUP.md` for testing guide

## Deployment

See `DEPLOYMENT_GUIDE.md` for:
- Building for production
- Submitting to App Store
- Submitting to Google Play
- OTA updates with Expo

## License

UNLICENSED - Private project
