# Horizon HCM Mobile App

React Native mobile application for Horizon HCM built with Expo.

## Features

### Authentication

- ✅ Login with email/password
- ✅ User registration
- ✅ Password reset flow
- 🔄 Two-factor authentication (planned)
- 🔄 Biometric authentication (planned)

### Core Features

- ✅ Dashboard with role-based content
- ✅ Buildings management
- ✅ Apartments listing and search
- ✅ Residents directory
- ✅ Invoices with status filters
- ✅ Payment history
- ✅ Announcements with priority filters
- ✅ Maintenance requests

### Technical Stack

- **Framework**: React Native with Expo SDK 54
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **State Management**:
  - Zustand (client state)
  - React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **API**: Axios with shared package integration
- **Real-time**: Socket.io-client (ready for WebSocket)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (for testing)
npm run web
```

### Development with Expo Go

1. Install Expo Go app on your phone
2. Run `npm start`
3. Scan the QR code with your phone

## Project Structure

```
src/
├── navigation/          # Navigation configuration
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screen
│   ├── buildings/     # Buildings screens
│   ├── apartments/    # Apartments screens
│   ├── residents/     # Residents screens
│   ├── invoices/      # Invoices screens
│   ├── payments/      # Payments screens
│   ├── announcements/ # Announcements screens
│   └── maintenance/   # Maintenance screens
├── components/        # Reusable components
├── theme/            # Theme configuration
└── types/            # TypeScript types
```

## Configuration

### API Endpoint

The API endpoint is configured in `App.tsx`:

```typescript
configureAPIClient('http://localhost:3001/api');
```

For production, update this to your production API URL.

### Theme

Theme configuration is in `src/theme/index.ts`. Customize colors, typography, and spacing there.

## Building for Production

### iOS

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## Features Roadmap

### Phase 1 (Current)

- ✅ Basic authentication
- ✅ Core CRUD screens
- ✅ Navigation structure

### Phase 2 (Next)

- 🔄 Biometric authentication
- 🔄 Push notifications
- 🔄 Camera integration for maintenance photos
- 🔄 Offline support with AsyncStorage
- 🔄 Pull-to-refresh on all lists

### Phase 3 (Future)

- 🔄 Real-time updates via WebSocket
- 🔄 Document viewer
- 🔄 Meeting calendar
- 🔄 Polls and voting
- 🔄 Reports and analytics

## Contributing

This is part of the Horizon HCM monorepo. See the root README for contribution guidelines.

## License

Proprietary - All rights reserved
