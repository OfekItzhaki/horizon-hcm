# Environment Variables

This document describes all environment variables used across the Horizon HCM frontend monorepo.

## Web Application (`packages/web`)

Create a `.env` file in `packages/web/` with the following variables:

### Required Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# WebSocket Configuration
VITE_WS_URL=ws://localhost:3001
```

### Optional Variables

```env
# Environment
VITE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false

# Analytics (if enabled)
VITE_GA_TRACKING_ID=your-ga-tracking-id

# Error Tracking (if enabled)
VITE_SENTRY_DSN=your-sentry-dsn
```

## Mobile Application (`packages/mobile`)

The mobile app uses the shared package configuration. No separate `.env` file is needed.

### Configuration

The API base URL is configured in `App.tsx`:

```typescript
configureAPIClient({
  baseURL: 'http://localhost:3001/api',
  // ... other config
});
```

### Production Configuration

For production builds, update the `baseURL` in `App.tsx` to your production API URL:

```typescript
configureAPIClient({
  baseURL: 'https://api.yourdomain.com/api',
  // ... other config
});
```

## Shared Package (`packages/shared`)

The shared package does not use environment variables directly. Configuration is passed programmatically via the `configureAPIClient` function.

## Environment-Specific Configuration

### Development

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

### Staging

```env
VITE_API_BASE_URL=https://api-staging.yourdomain.com/api
VITE_WS_URL=wss://api-staging.yourdomain.com
VITE_ENV=staging
```

### Production

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_GA_TRACKING_ID=your-production-ga-id
VITE_SENTRY_DSN=your-production-sentry-dsn
```

## Security Notes

1. Never commit `.env` files to version control
2. Use `.env.example` files as templates
3. Store sensitive values in secure environment variable services
4. Rotate API keys and tokens regularly
5. Use different credentials for each environment

## Accessing Environment Variables

### Web Application (Vite)

```typescript
// Access environment variables
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const wsUrl = import.meta.env.VITE_WS_URL;
```

### Mobile Application (Expo)

```typescript
// Configure at app initialization
import { configureAPIClient } from '@horizon-hcm/shared';

configureAPIClient({
  baseURL: 'http://localhost:3001/api',
  // ... other config
});
```

## Troubleshooting

### Web: Environment variables not loading

1. Ensure variable names start with `VITE_`
2. Restart the development server after changing `.env`
3. Check that `.env` file is in the correct directory (`packages/web/`)

### Mobile: API connection issues

1. Ensure backend API is running
2. Check the `baseURL` in `App.tsx`
3. For physical devices, use your computer's IP address instead of `localhost`
4. For Android emulator, use `10.0.2.2` instead of `localhost`
5. For iOS simulator, `localhost` should work

### CORS Issues

If you encounter CORS errors:

1. Ensure backend CORS is configured to allow your frontend origin
2. Check that API URL includes the correct protocol (`http://` or `https://`)
3. Verify WebSocket URL uses correct protocol (`ws://` or `wss://`)

## Example Files

### Web `.env.example`

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001

# Environment
VITE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

### Mobile Configuration Example

```typescript
// App.tsx
configureAPIClient({
  baseURL: __DEV__ 
    ? 'http://localhost:3001/api' 
    : 'https://api.yourdomain.com/api',
  getTokens: () => {
    // ... token management
  },
  // ... other config
});
```
