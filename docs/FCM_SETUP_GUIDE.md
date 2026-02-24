# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in the Horizon HCM backend.

## Important: Two Different Firebase Files

Firebase uses **two different JSON files** for different purposes:

### 1. `google-services.json` (For Mobile App)
- **Purpose**: Used by the Android mobile app to receive notifications
- **Location**: `horizon-hcm-frontend/packages/mobile/google-services.json`
- **Contains**: API keys, project info, client info
- **Used by**: Expo/React Native app
- **Download from**: Firebase Console → Project Settings → General → Your apps → Download google-services.json
- **Status**: ✅ Already configured

### 2. `firebase-service-account.json` (For Backend Server)
- **Purpose**: Used by the backend server to send notifications
- **Location**: `firebase-service-account.json` (backend root)
- **Contains**: Private key, service account credentials
- **Used by**: NestJS backend server
- **Download from**: Firebase Console → Project Settings → Service Accounts → Generate new private key
- **Status**: ⏳ Needs to be downloaded

**⚠️ These are NOT interchangeable!** You need both files for push notifications to work.

## Backend Setup (firebase-service-account.json)

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **horizon-hcm**
3. Click the gear icon (⚙️) next to "Project Overview" → **Project settings**
4. Go to the **"Service accounts"** tab
5. Click **"Generate new private key"** button
6. Click **"Generate key"** in the confirmation dialog
7. Save the downloaded JSON file as `firebase-service-account.json` in the backend project root

### Step 2: Verify File Format

The `firebase-service-account.json` file should look like this:

```json
{
  "type": "service_account",
  "project_id": "horizon-hcm",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@horizon-hcm.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Key fields to verify**:
- ✅ `"type": "service_account"`
- ✅ `"private_key"` starts with `"-----BEGIN PRIVATE KEY-----"`
- ✅ `"client_email"` contains `firebase-adminsdk`

**❌ If your file looks like this, it's the WRONG file** (this is google-services.json):
```json
{
  "project_info": {
    "project_number": "...",
    "project_id": "horizon-hcm"
  },
  "client": [...]
}
```

### Step 3: Environment Configuration

The `.env` file is already configured with:
```
FCM_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Step 4: Restart Backend Server

After placing the correct `firebase-service-account.json` file:

```bash
# Stop the current backend server (if running)
# Then restart it
npm run start:dev
```

### Step 5: Verify FCM Initialization

Check the backend logs for:
```
✅ FCM Provider initialized
```

If you see this error instead:
```
❌ Failed to initialize FCM Provider
```

Common issues:
1. **Wrong file**: You're using `google-services.json` instead of the service account key
2. **Missing file**: The file doesn't exist at the specified path
3. **Invalid JSON**: The file is corrupted or incomplete

## Mobile App Setup (google-services.json)

See `horizon-hcm-frontend/packages/mobile/PUSH_NOTIFICATIONS_SETUP.md` for mobile app configuration.

## Testing Push Notifications

### 1. Create Notification Templates

The backend needs notification templates in the database. Run this SQL:

```sql
-- New Poll Template
INSERT INTO notification_templates (name, title, body, variables, created_at, updated_at)
VALUES (
  'new_poll',
  'New Poll',
  '{{pollTitle}} - Vote by {{endDate}}',
  '{"pollTitle": "string", "endDate": "string"}',
  NOW(),
  NOW()
);

-- New Message Template
INSERT INTO notification_templates (name, title, body, variables, created_at, updated_at)
VALUES (
  'new_message',
  'New Message',
  '{{senderName}}: {{messagePreview}}',
  '{"senderName": "string", "messagePreview": "string"}',
  NOW(),
  NOW()
);

-- New Invoice Template
INSERT INTO notification_templates (name, title, body, variables, created_at, updated_at)
VALUES (
  'new_invoice',
  'New Invoice',
  'Invoice {{invoiceNumber}} for {{amount}} - Due {{dueDate}}',
  '{"invoiceNumber": "string", "amount": "string", "dueDate": "string", "title": "string"}',
  NOW(),
  NOW()
);
```

### 2. Register Device Token

From the mobile app, register a device token:

```typescript
// This happens automatically when the app starts
await apiClient.post('/notifications/push-token', {
  token: 'expo-push-token-here',
  platform: 'expo',
});
```

### 3. Trigger a Notification

Create a poll, message, or invoice:

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

### 4. Verify Notification

Check:
1. Backend logs for "Push notification sent"
2. Mobile device receives the notification
3. Database `notification_logs` table has the entry

## Notification Flow

```
1. User creates poll/message/invoice
   ↓
2. Backend command handler executes
   ↓
3. NotificationService.sendPushNotification() called
   ↓
4. Template variables replaced
   ↓
5. FCM Provider sends to device tokens
   ↓
6. Mobile app receives notification
   ↓
7. User taps notification → app opens
```

## Security

The `firebase-service-account.json` file contains sensitive credentials:
- ✅ Added to `.gitignore`
- ✅ Never commit to version control
- ✅ Store securely in production (environment variables or secrets manager)

## Production Deployment

For production, use environment variables instead of a file:

```bash
# Set these in your hosting platform
FCM_PROJECT_ID=horizon-hcm
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@horizon-hcm.iam.gserviceaccount.com
```

Update `src/notifications/providers/fcm.provider.ts` to read from env vars in production.

## Troubleshooting

### "MODULE_NOT_FOUND" Error

```bash
# Install firebase-admin
npm install firebase-admin
```

### "Failed to initialize FCM Provider"

1. Check file exists: `ls firebase-service-account.json`
2. Verify file format (should have `"type": "service_account"`)
3. Check `.env` has correct path
4. Restart backend server

### Notifications Not Received

1. Verify FCM initialized: Check logs for "✅ FCM Provider initialized"
2. Check device token registered: Query `user_devices` table
3. Verify notification templates exist: Query `notification_templates` table
4. Check notification logs: Query `notification_logs` table
5. Test with Firebase Console: Send test notification directly

## Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [FCM Server Documentation](https://firebase.google.com/docs/cloud-messaging/server)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
