# Environment Variables Documentation

This document describes all environment variables used in Horizon-HCM.

## Authentication

### AUTH_MODE
- **Type**: String
- **Required**: Yes
- **Values**: `full` | `sso`
- **Default**: `full`
- **Description**: Authentication mode. Use `full` for standalone authentication or `sso` for centralized auth service.

### DATABASE_URL
- **Type**: String (Connection URL)
- **Required**: Yes (when AUTH_MODE=full)
- **Example**: `postgresql://user:password@localhost:5432/horizon_hcm?schema=public`
- **Description**: PostgreSQL database connection string.

### JWT_PRIVATE_KEY
- **Type**: String (PEM format)
- **Required**: Yes
- **Description**: RSA private key for JWT signing. Use `\n` for newlines in environment variables.

### JWT_PUBLIC_KEY
- **Type**: String (PEM format)
- **Required**: Yes
- **Description**: RSA public key for JWT verification.

### JWT_PRIVATE_KEY_PATH
- **Type**: String (File path)
- **Required**: No
- **Description**: Path to private key file. Alternative to JWT_PRIVATE_KEY.

### JWT_PUBLIC_KEY_PATH
- **Type**: String (File path)
- **Required**: No
- **Description**: Path to public key file. Alternative to JWT_PUBLIC_KEY.

### COOKIE_DOMAIN
- **Type**: String
- **Required**: No
- **Default**: `localhost`
- **Example**: `.horizon-hcm.com`
- **Description**: Domain for authentication cookies.

### COOKIE_SECURE
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Enable secure cookies (HTTPS only). Set to `true` in production.

## Redis

### REDIS_HOST
- **Type**: String
- **Required**: Yes
- **Default**: `localhost`
- **Description**: Redis server hostname.

### REDIS_PORT
- **Type**: Number
- **Required**: Yes
- **Default**: `6379`
- **Description**: Redis server port.

### REDIS_PASSWORD
- **Type**: String
- **Required**: No
- **Description**: Redis authentication password.

### REDIS_TLS
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Enable TLS for Redis connection.

## Application

### PORT
- **Type**: Number
- **Required**: No
- **Default**: `3001`
- **Description**: HTTP server port.

### NODE_ENV
- **Type**: String
- **Required**: Yes
- **Values**: `development` | `staging` | `production`
- **Default**: `development`
- **Description**: Application environment.

### APP_NAME
- **Type**: String
- **Required**: No
- **Default**: `Horizon-HCM`
- **Description**: Application name for logging and emails.

### FRONTEND_URL
- **Type**: String (URL)
- **Required**: Yes
- **Example**: `https://app.horizon-hcm.com`
- **Description**: Frontend application URL for email links and CORS.

## Feature Flags

### ENABLE_2FA
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable two-factor authentication.

### ENABLE_DEVICE_MGMT
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable device management features.

### MAX_DEVICES
- **Type**: Number
- **Required**: No
- **Default**: `10`
- **Description**: Maximum devices per user.

### ENABLE_PUSH
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable push notifications.

### ENABLE_ACCOUNT_MGMT
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable account deactivation/reactivation.

### ALLOW_REACTIVATION
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Allow users to reactivate deactivated accounts.

## Caching

### CACHE_NAMESPACE
- **Type**: String
- **Required**: No
- **Default**: `horizon-hcm`
- **Description**: Redis key namespace for caching.

## Logging

### LOG_LEVEL
- **Type**: String
- **Required**: No
- **Values**: `debug` | `info` | `warn` | `error`
- **Default**: `info`
- **Description**: Minimum log level to output.

### SEQ_URL
- **Type**: String (URL)
- **Required**: No
- **Example**: `http://localhost:5341`
- **Description**: Seq log aggregation server URL.

### SEQ_API_KEY
- **Type**: String
- **Required**: No
- **Description**: Seq API key for authentication.

## Security

### IP_WHITELIST
- **Type**: String (Comma-separated)
- **Required**: No
- **Example**: `127.0.0.1,192.168.1.0/24,10.0.0.*`
- **Description**: Allowed IP addresses. Supports exact IPs, CIDR notation, and wildcards.

## File Storage

### AWS_ACCESS_KEY_ID
- **Type**: String
- **Required**: No (required for S3 storage)
- **Description**: AWS access key ID for S3.

### AWS_SECRET_ACCESS_KEY
- **Type**: String
- **Required**: No (required for S3 storage)
- **Description**: AWS secret access key for S3.

### AWS_REGION
- **Type**: String
- **Required**: No
- **Default**: `us-east-1`
- **Description**: AWS region for S3 bucket.

### AWS_S3_BUCKET
- **Type**: String
- **Required**: No (required for S3 storage)
- **Description**: S3 bucket name for file storage.

## Push Notifications

### FCM_SERVICE_ACCOUNT_PATH
- **Type**: String (File path)
- **Required**: No (required for FCM)
- **Description**: Path to Firebase service account JSON file.

### APNS_KEY_PATH
- **Type**: String (File path)
- **Required**: No (required for APNS)
- **Description**: Path to Apple Push Notification Service key file (.p8).

### APNS_KEY_ID
- **Type**: String
- **Required**: No (required for APNS)
- **Description**: APNS key ID.

### APNS_TEAM_ID
- **Type**: String
- **Required**: No (required for APNS)
- **Description**: Apple Developer Team ID.

### VAPID_PUBLIC_KEY
- **Type**: String
- **Required**: No (required for Web Push)
- **Description**: VAPID public key for web push notifications.

### VAPID_PRIVATE_KEY
- **Type**: String
- **Required**: No (required for Web Push)
- **Description**: VAPID private key for web push notifications.

### VAPID_SUBJECT
- **Type**: String (Email or URL)
- **Required**: No (required for Web Push)
- **Example**: `mailto:support@horizon-hcm.com`
- **Description**: VAPID subject (contact email or URL).

## Rate Limiting

### RATE_LIMIT_TTL
- **Type**: Number (seconds)
- **Required**: No
- **Default**: `60`
- **Description**: Rate limit time window in seconds.

### RATE_LIMIT_MAX
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Maximum requests per time window.

## Environment-Specific Recommendations

### Development
- Use `LOG_LEVEL=debug` for detailed logging
- Disable IP whitelist for easier testing
- Use local Redis and database
- Mock external services (FCM, APNS, S3)

### Staging
- Use `LOG_LEVEL=info`
- Enable IP whitelist for internal networks
- Use staging databases and services
- Test with real external services

### Production
- Use `LOG_LEVEL=warn` or `error`
- Strict IP whitelist
- Enable TLS for Redis
- Use secrets manager for sensitive values
- Enable `COOKIE_SECURE=true`
- Reduce `MAX_DEVICES` for security
