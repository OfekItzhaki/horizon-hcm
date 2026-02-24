# Push Notifications Testing Guide

This guide walks you through testing the push notifications system end-to-end.

## Prerequisites

- ✅ Backend running on http://localhost:3001
- ✅ FCM initialized (check logs for "✅ FCM Provider initialized")
- ✅ Notification templates created in database
- ✅ Valid JWT token for authentication

## Testing Steps

### Step 1: Get a JWT Token

**Option A: Use existing user**
```bash
# Login via API
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Option B: Use Swagger UI**
1. Go to http://localhost:3001/api/docs
2. Click "Authorize" button
3. Login and copy the token

Save the token as an environment variable:
```bash
export TOKEN="your-jwt-token-here"
```

### Step 2: Register a Push Token

```bash
curl -X POST http://localhost:3001/notifications/push-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[test-device-123]",
    "platform": "expo",
    "deviceName": "Test Device"
  }'
```

**Expected Response:**
```json
{
  "message": "Push token registered successfully"
}
```

### Step 3: Create a Test Poll (Triggers Notification)

```bash
curl -X POST http://localhost:3001/buildings/1/polls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Poll for Push Notifications",
    "description": "Testing if notifications work",
    "options": ["Yes", "No", "Maybe"],
    "allowMultiple": false,
    "isAnonymous": false,
    "endDate": "2026-03-01T00:00:00Z"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "title": "Test Poll for Push Notifications",
  ...
}
```

**What happens:**
- Poll is created in database
- Notification is queued for all building residents
- FCM sends push notification to registered devices

### Step 4: Check Notifications

```bash
curl -X GET "http://localhost:3001/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "New Poll",
      "body": "Test Poll for Push Notifications - Vote by ...",
      "type": "new_poll",
      "read": false,
      "readAt": null,
      "createdAt": "2026-02-24T..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Step 5: Check Unread Count

```bash
curl -X GET http://localhost:3001/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "count": 1
}
```

### Step 6: Mark Notification as Read

```bash
# Replace NOTIFICATION_ID with actual ID from step 4
curl -X PATCH http://localhost:3001/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Notification marked as read"
}
```

### Step 7: Verify Unread Count Decreased

```bash
curl -X GET http://localhost:3001/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "count": 0
}
```

### Step 8: Test Message Notification

```bash
curl -X POST http://localhost:3001/buildings/1/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "recipient-user-id",
    "content": "Test message for push notifications"
  }'
```

### Step 9: Test Invoice Notification

```bash
curl -X POST http://localhost:3001/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buildingId": "1",
    "apartmentId": "apartment-id",
    "title": "Test Invoice",
    "description": "Testing invoice notifications",
    "amount": 100.00,
    "dueDate": "2026-03-15T00:00:00Z"
  }'
```

### Step 10: Mark All as Read

```bash
curl -X POST http://localhost:3001/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "All notifications marked as read",
  "count": 3
}
```

## Verification Checklist

- [ ] Push token registered successfully
- [ ] Poll created successfully
- [ ] Notification appears in GET /notifications
- [ ] Unread count is correct
- [ ] Mark as read works
- [ ] Unread count decreases after marking as read
- [ ] Message notification works
- [ ] Invoice notification works
- [ ] Mark all as read works

## Troubleshooting

### "FCM not initialized"
- Check backend logs for FCM initialization error
- Verify `firebase-service-account.json` exists and is valid
- Restart backend server

### "Unauthorized" (401)
- Token expired - get a new token
- Token invalid - check format
- User doesn't exist

### "Building not found" (404)
- Update building ID to a valid one
- Create a building first

### Notifications not appearing
- Check `notification_logs` table in database
- Check `notification_templates` table has templates
- Check backend logs for errors

### Push notification not received on device
- This is expected in testing - you need a real device with Expo app
- For now, verify notifications are created in database
- Mobile app implementation needed to receive actual push notifications

## Database Verification

Check notifications in database:

```sql
-- Check notification templates
SELECT * FROM notification_templates;

-- Check notification logs
SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10;

-- Check push tokens
SELECT * FROM push_tokens WHERE active = true;

-- Check devices
SELECT * FROM devices ORDER BY "lastActiveAt" DESC LIMIT 10;
```

## Next Steps

After backend testing is complete:

1. Implement mobile app notification handling
2. Test on real device with Expo
3. Verify push notifications are received
4. Test notification tap handling
5. Test deep linking

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications/push-token` | POST | Register device token |
| `/notifications/push-token` | DELETE | Unregister device token |
| `/notifications` | GET | Get user notifications |
| `/notifications/unread-count` | GET | Get unread count |
| `/notifications/:id/read` | PATCH | Mark as read |
| `/notifications/read-all` | POST | Mark all as read |
| `/buildings/:id/polls` | POST | Create poll (triggers notification) |
| `/buildings/:id/messages` | POST | Send message (triggers notification) |
| `/invoices` | POST | Create invoice (triggers notification) |

## Success Criteria

✅ All API endpoints return expected responses
✅ Notifications are created in database
✅ Read/unread status works correctly
✅ Unread count is accurate
✅ Push tokens are stored correctly
✅ FCM provider is initialized

The backend push notification system is fully functional and ready for mobile app integration!
