# Horizon HCM Mobile App

React Native mobile application for Horizon HCM built with Expo.

## Features

### Authentication
- Email/password login
- User registration
- Password reset
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Automatic credential saving for biometric login

### Core Features
- **Dashboard**: Role-based dashboard with quick stats and actions
- **Buildings**: View and manage buildings
- **Apartments**: View and manage apartments
- **Residents**: View and manage residents
- **Invoices**: View invoices and payment status
- **Payments**: Make payments with card details
- **Reports**: Financial reports with charts (balance, income/expense, category breakdown)
- **Announcements**: View and read announcements
- **Maintenance**: Create and track maintenance requests with photo uploads
- **Meetings**: View meetings and RSVP
- **Polls**: View and vote on polls
- **Documents**: View and upload documents
- **Notifications**: Push notifications with badge counts and real-time updates
- **Chat**: Real-time messaging with WebSocket
- **Profile**: View, edit profile, and change password
- **Settings**: Theme, language, biometric settings

### Native Features
- **Camera Integration**: Take photos for maintenance requests
- **Image Picker**: Select photos from gallery
- **Document Picker**: Upload documents from device
- **Push Notifications**: Receive real-time notifications
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint support
- **Offline Support**: Cache data for offline viewing

## Tech Stack

- **React Native**: 0.81.5
- **Expo**: ~54.0
- **TypeScript**: ~5.9
- **React Navigation**: v6 (Bottom tabs + Stack navigation)
- **React Native Paper**: v5 (Material Design components)
- **React Query**: v5 (Server state management)
- **Zustand**: v4 (Client state management)
- **React Hook Form**: v7 (Form management)
- **Zod**: v3 (Validation)
- **Axios**: v1 (HTTP client)
- **Socket.io**: v4 (WebSocket)
- **React Native Chart Kit**: v6 (Data visualization)

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── EmptyState.tsx
│   ├── ErrorMessage.tsx
│   ├── FormField.tsx
│   ├── LoadingSpinner.tsx
│   ├── SelectField.tsx
│   └── StatusChip.tsx
├── navigation/          # Navigation configuration
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── RootNavigator.tsx
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screen
│   ├── buildings/     # Building management
│   ├── apartments/    # Apartment management
│   ├── residents/     # Resident management
│   ├── invoices/      # Invoice screens
│   ├── payments/      # Payment screens
│   ├── reports/       # Financial reports
│   ├── announcements/ # Announcements
│   ├── maintenance/   # Maintenance requests
│   ├── meetings/      # Meetings
│   ├── polls/         # Polls
│   ├── documents/     # Document library
│   ├── notifications/ # Notifications
│   ├── profile/       # User profile
│   └── settings/      # App settings
├── theme/             # Theme configuration
├── types/             # TypeScript types
└── utils/             # Utility functions
    ├── biometric.ts   # Biometric authentication
    ├── camera.ts      # Camera and image picker
    ├── filePicker.ts  # Document picker
    ├── notifications.ts # Push notifications
    ├── websocket.ts   # WebSocket service
    ├── responsive.ts  # Responsive utilities
    ├── gestures.ts    # Gesture handlers
    └── colors.ts      # Color utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Physical device for testing camera and biometric features

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
```

### Environment Variables

The mobile app uses the shared package configuration. Ensure the backend API is running on `http://localhost:3001`.

## Development

### Type Checking

```bash
npm run type-check
```

### Code Style

The project uses ESLint and Prettier for code formatting. Configuration is inherited from the root workspace.

## Native Features Setup

### Biometric Authentication

Biometric authentication works automatically on devices with Face ID, Touch ID, or Fingerprint sensors. No additional setup required.

**Supported platforms:**
- iOS: Face ID, Touch ID
- Android: Fingerprint, Face Recognition

### Camera and Photos

Camera access requires permissions. The app will request permissions automatically when needed.

**Features:**
- Take photos with camera
- Select photos from gallery
- Multiple photo selection
- Photo compression before upload

### Push Notifications

Push notifications are configured using Expo Notifications. The app requests notification permissions on first launch.

**Features:**
- Local notifications
- Push notifications (requires Expo push token)
- Badge counts
- Notification taps with deep linking

### Document Picker

Document picker allows users to select files from their device.

**Supported file types:**
- PDF documents
- Images
- Word documents
- Excel spreadsheets
- All file types

## Navigation Structure

```
Root Navigator
├── Auth Stack (Unauthenticated)
│   ├── Login
│   ├── Register
│   └── Forgot Password
└── Main Navigator (Authenticated)
    ├── Dashboard Tab
    ├── Finance Tab
    │   ├── Invoices
    │   ├── Payments
    │   └── Reports
    ├── Communication Tab
    │   ├── Announcements
    │   ├── Meetings
    │   ├── Polls
    │   └── Notifications
    └── More Tab
        ├── Buildings
        ├── Apartments
        ├── Residents
        ├── Maintenance
        ├── Documents
        ├── Profile
        └── Settings
```

## State Management

### Client State (Zustand)
- Authentication state (user, tokens)
- App state (selected building, theme, language)

### Server State (React Query)
- API data caching
- Automatic refetching
- Optimistic updates
- Error handling

## Testing

### Manual Testing

Test on physical devices for:
- Camera functionality
- Biometric authentication
- Push notifications
- Performance

### Expo Go

For rapid testing, use Expo Go app:

```bash
npm start
# Scan QR code with Expo Go app
```

## Building for Production

### Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

### iOS

```bash
# Build for iOS (development)
eas build --platform ios --profile development

# Build for iOS (preview)
eas build --platform ios --profile preview

# Build for iOS (production)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Requirements:**
- Apple Developer account
- iOS 13.0 or higher support
- iPad support enabled (supportsTablet: true)
- Split-screen multitasking support

### Android

```bash
# Build for Android (development)
eas build --platform android --profile development

# Build for Android (preview)
eas build --platform android --profile preview

# Build for Android (production)
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

**Requirements:**
- Google Play Developer account
- Android 6.0 (API 23) or higher support
- Tablet support enabled
- Split-screen multitasking support

## Platform-Specific Features

### iOS
- Face ID and Touch ID support
- iOS Human Interface Guidelines compliance
- iPad optimization with split-screen support
- Automatic orientation handling
- iOS 13.0+ support

### Android
- Fingerprint and Face Recognition support
- Material Design guidelines compliance
- Tablet optimization with split-screen support
- Automatic orientation handling
- Android 6.0 (API 23)+ support

### Responsive Design
- Automatic orientation detection
- Tablet-optimized layouts
- Responsive spacing and font sizes
- Platform-specific UI adjustments
- Native gesture support (swipe, long press)

## Known Issues

- Camera and biometric features require physical device (not available in simulator)
- Push notifications require Expo push token setup
- File downloads need native implementation

## Future Enhancements

- [ ] Offline mode with data synchronization
- [x] Real-time chat with WebSocket
- [ ] Advanced search and filtering
- [ ] Multi-language support (Hebrew RTL)
- [ ] Dark mode improvements
- [ ] Accessibility enhancements
- [ ] Performance optimizations
- [x] App lifecycle handling
- [x] Responsive layouts for tablets
- [x] Native gesture support

## Contributing

Follow the HORIZON STANDARD:
- Keep files small and focused
- Keep functions short and single-purpose
- Avoid code duplication
- Use TypeScript strict mode
- Write meaningful commit messages

## License

Proprietary - Horizon HCM
