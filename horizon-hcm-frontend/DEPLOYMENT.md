# Deployment Guide

This guide covers deploying the Horizon HCM frontend applications to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Web Application Deployment](#web-application-deployment)
- [Mobile Application Deployment](#mobile-application-deployment)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

### General Requirements

- Node.js 18+ installed
- npm 9+ installed
- Git repository access
- Backend API deployed and accessible

### Web Deployment Requirements

- Vercel or Netlify account
- Custom domain (optional)
- SSL certificate (provided by hosting platform)

### Mobile Deployment Requirements

- Expo account (free tier available)
- EAS CLI installed: `npm install -g eas-cli`
- Apple Developer account ($99/year) for iOS
- Google Play Developer account ($25 one-time) for Android

## Web Application Deployment

### Option 1: Vercel (Recommended)

#### Initial Setup

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link project:
```bash
cd packages/web
vercel link
```

#### Configuration

Create `vercel.json` in `packages/web/`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@api-base-url",
    "VITE_WS_URL": "@ws-url"
  }
}
```

#### Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables

Set environment variables in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `VITE_API_BASE_URL`: Your production API URL
   - `VITE_WS_URL`: Your production WebSocket URL
   - `VITE_ENV`: `production`

### Option 2: Netlify

#### Initial Setup

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize site:
```bash
cd packages/web
netlify init
```

#### Configuration

Create `netlify.toml` in `packages/web/`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Deploy

```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### Environment Variables

Set environment variables in Netlify dashboard:

1. Go to Site Settings → Environment Variables
2. Add variables (same as Vercel)

### Custom Domain Setup

#### Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

#### Netlify

1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS records
4. SSL certificate is automatically provisioned

## Mobile Application Deployment

### Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure project:
```bash
cd packages/mobile
eas build:configure
```

### iOS Deployment

#### Requirements

- Apple Developer account
- App Store Connect access
- iOS distribution certificate
- Provisioning profile

#### Build Configuration

Update `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourdomain.horizonhcm",
      "buildNumber": "1.0.0",
      "supportsTablet": true
    }
  }
}
```

#### Build for iOS

```bash
# Development build (for testing)
eas build --platform ios --profile development

# Preview build (for TestFlight)
eas build --platform ios --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
```

#### Submit to App Store

1. Prepare app metadata:
   - App name
   - Description
   - Screenshots (required sizes)
   - App icon
   - Privacy policy URL
   - Support URL

2. Submit build:
```bash
eas submit --platform ios
```

3. Complete App Store Connect setup:
   - Add app information
   - Upload screenshots
   - Set pricing
   - Submit for review

#### TestFlight Distribution

```bash
# Build and submit to TestFlight
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

### Android Deployment

#### Requirements

- Google Play Developer account
- Keystore for app signing
- Service account key (for automated submission)

#### Build Configuration

Update `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.yourdomain.horizonhcm",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "USE_BIOMETRIC"
      ]
    }
  }
}
```

#### Build for Android

```bash
# Development build (APK for testing)
eas build --platform android --profile development

# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

#### Submit to Google Play

1. Create app in Google Play Console:
   - App name
   - Description
   - Screenshots
   - Feature graphic
   - App icon
   - Privacy policy URL

2. Submit build:
```bash
eas submit --platform android
```

3. Complete Play Console setup:
   - Content rating
   - Target audience
   - Store listing
   - Pricing & distribution

#### Internal Testing

```bash
# Build and submit to internal testing track
eas build --platform android --profile preview
eas submit --platform android --track internal
```

## Environment Configuration

### Development

```env
# Web
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development

# Mobile (in App.tsx)
baseURL: 'http://localhost:3001/api'
```

### Staging

```env
# Web
VITE_API_BASE_URL=https://api-staging.yourdomain.com/api
VITE_WS_URL=wss://api-staging.yourdomain.com
VITE_ENV=staging

# Mobile (in App.tsx)
baseURL: 'https://api-staging.yourdomain.com/api'
```

### Production

```env
# Web
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Mobile (in App.tsx)
baseURL: 'https://api.yourdomain.com/api'
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  deploy-web:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build:web
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-mobile:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g eas-cli
      - run: npm install
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Automated Deployment Workflow

1. Developer pushes to feature branch
2. CI runs tests and linting
3. Pull request created
4. Code review
5. Merge to main branch
6. CI runs tests again
7. Automatic deployment to production
8. Deployment notification

## Monitoring and Maintenance

### Error Tracking

#### Sentry Setup

1. Create Sentry project
2. Install Sentry SDK:
```bash
npm install @sentry/react @sentry/vite-plugin
```

3. Configure Sentry in web app:
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
  tracesSampleRate: 1.0,
});
```

4. Configure Sentry in mobile app:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: __DEV__ ? 'development' : 'production',
});
```

### Analytics

#### Google Analytics Setup

1. Create GA4 property
2. Install GA SDK:
```bash
npm install react-ga4
```

3. Configure GA:
```typescript
import ReactGA from 'react-ga4';

ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);
```

### Performance Monitoring

#### Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Health Checks

#### Web Application

Create health check endpoint:
```typescript
// src/api/health.ts
export const healthCheck = async () => {
  const response = await fetch('/api/health');
  return response.ok;
};
```

#### Mobile Application

Check API connectivity on app start:
```typescript
useEffect(() => {
  const checkHealth = async () => {
    try {
      await api.health();
    } catch (error) {
      // Show offline banner
    }
  };
  checkHealth();
}, []);
```

## Rollback Procedures

### Web Application

#### Vercel

1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

#### Netlify

1. Go to Deploys
2. Find previous successful deploy
3. Click "Publish deploy"

### Mobile Application

#### iOS

1. Go to App Store Connect
2. Select previous version
3. Submit for review (if needed)

#### Android

1. Go to Google Play Console
2. Select previous release
3. Promote to production

## Troubleshooting

### Common Issues

#### Web: Build Fails

- Check Node.js version (18+)
- Clear node_modules and reinstall
- Check environment variables
- Review build logs

#### Mobile: Build Fails

- Check EAS CLI version
- Verify app.json configuration
- Check credentials
- Review build logs in Expo dashboard

#### API Connection Issues

- Verify API URL is correct
- Check CORS configuration
- Verify SSL certificate
- Test API endpoint directly

### Support

For deployment issues:
1. Check documentation
2. Review error logs
3. Contact DevOps team
4. Create support ticket

## Security Checklist

- [ ] Environment variables configured
- [ ] SSL certificates active
- [ ] API authentication working
- [ ] CORS properly configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Backup procedures in place
- [ ] Monitoring alerts set up
- [ ] Security headers configured
- [ ] Rate limiting enabled

## Post-Deployment Checklist

- [ ] Web application accessible
- [ ] Mobile apps submitted
- [ ] All features working
- [ ] Authentication functional
- [ ] Real-time features working
- [ ] Push notifications working
- [ ] Error tracking active
- [ ] Analytics tracking
- [ ] Performance acceptable
- [ ] Documentation updated
