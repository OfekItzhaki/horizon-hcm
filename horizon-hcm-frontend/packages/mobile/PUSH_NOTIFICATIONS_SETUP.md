# Push Notifications Setup Guide

This guide explains how to set up push notifications for the Horizon HCM mobile app using Firebase Cloud Messaging (FCM) and Expo.

## Prerequisites

- Firebase project created (horizon-hcm)
- `google-services.json` file downloaded and placed in this directory
- Expo account (for building the app)

## Current Setup Status

✅ `expo-notifications` package installed
✅ `google-services.json` configured in `app.json`
✅ Notification permissions configured
✅ Background notification handling enabled

## Firebase Configuration

### Android Setup (Already Configured)

The `google-services.json` file is already configured in `app.json`:

```json
"android": {
  "googleServicesFile": "./google-services.json",
  "package": "com.ofeklabs.horizon_hcm"
}
```

### iOS Setup (Optional - for future)

For iOS push notifications, you'll need:

1. Apple Developer account ($99/year)
2. APNs certificate or key
3. `GoogleService-Info.plist` file from Firebase

## Implementation

### 1. Request Notification Permissions

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token?.data;
}
```

### 2. Send Token to Backend

```typescript
import { apiClient } from '@horizon-hcm/shared';

async function registerDeviceToken() {
  const token = await registerForPushNotificationsAsync();

  if (token) {
    await apiClient.post('/notifications/push-token', {
      token,
      platform: 'expo',
    });
  }
}
```

### 3. Handle Notifications

```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function App() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerDeviceToken();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Navigate to relevant screen based on notification data
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return <YourApp />;
}
```

## Building the App

### Development Build

For push notifications to work, you need to create a development build (Expo Go doesn't support FCM):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --profile development --platform android

# Install on device
eas build:run -p android
```

### Production Build

```bash
# Build for Android
eas build --profile production --platform android

# Submit to Google Play Store
eas submit --platform android
```

## Testing Push Notifications

### 1. Register Device Token

After installing the app on a physical device:

1. Open the app
2. Grant notification permissions
3. The app will automatically register the device token with the backend

### 2. Trigger a Notification

Create a poll, message, or invoice from the web app or another device:

```bash
# Example: Create a poll
curl -X POST http://localhost:3001/buildings/1/polls \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Poll",
    "description": "This is a test",
    "options": ["Option 1", "Option 2"],
    "endDate": "2026-03-01T00:00:00Z"
  }'
```

### 3. Verify Notification Received

Check your device for the push notification. It should appear with:

- Title: "New Poll"
- Body: "Test Poll"
- Tap to open the app

## Notification Types

The backend sends notifications for:

1. **New Poll** (`new_poll`)
   - Sent to all building residents
   - Variables: `pollTitle`, `endDate`

2. **New Message** (`new_message`)
   - Sent to message recipient
   - Variables: `senderName`, `messagePreview`

3. **New Invoice** (`new_invoice`)
   - Sent to apartment owners
   - Variables: `invoiceNumber`, `amount`, `dueDate`, `title`

## Troubleshooting

### Notifications Not Received

1. **Check device token registration**:

   ```bash
   # Check backend logs for token registration
   # Should see: "Device token registered for user X"
   ```

2. **Verify FCM is initialized**:

   ```bash
   # Check backend logs for:
   # "✅ FCM Provider initialized"
   ```

3. **Check notification permissions**:
   - Go to device Settings → Apps → Horizon HCM → Notifications
   - Ensure notifications are enabled

4. **Verify google-services.json**:
   - Package name must match: `com.ofeklabs.horizon_hcm`
   - File must be in the correct location

### Build Errors

1. **"google-services.json not found"**:
   - Ensure file is in `horizon-hcm-frontend/packages/mobile/`
   - Check `app.json` has correct path

2. **"Invalid google-services.json"**:
   - Re-download from Firebase Console
   - Verify package name matches

## Next Steps

1. ✅ Android FCM configured
2. ⏳ Implement notification handling in mobile app
3. ⏳ Add deep linking for notification taps
4. ⏳ Test on physical Android device
5. ⏳ (Optional) Set up iOS APNS

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
