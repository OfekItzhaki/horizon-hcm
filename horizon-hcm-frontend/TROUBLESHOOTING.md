# Troubleshooting Guide

Common issues and solutions for Horizon HCM Frontend development and deployment.

## Table of Contents

- [Development Issues](#development-issues)
- [Build Issues](#build-issues)
- [API Connection Issues](#api-connection-issues)
- [Authentication Issues](#authentication-issues)
- [Mobile-Specific Issues](#mobile-specific-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

## Development Issues

### Issue: `npm install` fails

**Symptoms:**
- Installation errors
- Dependency conflicts
- Permission errors

**Solutions:**

1. Clear npm cache:
```bash
npm cache clean --force
```

2. Delete node_modules and package-lock.json:
```bash
rm -rf node_modules package-lock.json
npm install
```

3. Check Node.js version:
```bash
node --version  # Should be 18+
```

4. Use correct npm version:
```bash
npm --version  # Should be 9+
```

### Issue: TypeScript errors after pulling changes

**Symptoms:**
- Type errors in previously working code
- Missing type definitions
- Import errors

**Solutions:**

1. Rebuild TypeScript:
```bash
npm run build:shared
```

2. Restart TypeScript server (VS Code):
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type "TypeScript: Restart TS Server"

3. Clear TypeScript cache:
```bash
rm -rf packages/*/tsconfig.tsbuildinfo
npm run type-check
```

### Issue: Hot reload not working

**Symptoms:**
- Changes not reflected in browser
- Need to manually refresh
- Vite/Expo not detecting changes

**Solutions:**

1. Restart development server:
```bash
# Web
npm run dev:web

# Mobile
npm run dev:mobile
```

2. Clear Vite cache (web):
```bash
rm -rf packages/web/node_modules/.vite
```

3. Clear Metro cache (mobile):
```bash
cd packages/mobile
npx expo start --clear
```

## Build Issues

### Issue: Web build fails

**Symptoms:**
- Build errors
- Module not found errors
- Out of memory errors

**Solutions:**

1. Check for TypeScript errors:
```bash
npm run type-check
```

2. Increase Node.js memory:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:web
```

3. Clear build cache:
```bash
rm -rf packages/web/dist
npm run build:web
```

### Issue: Mobile build fails on EAS

**Symptoms:**
- EAS build errors
- Dependency installation fails
- Native module errors

**Solutions:**

1. Check app.json configuration:
```bash
cat packages/mobile/app.json
```

2. Verify EAS configuration:
```bash
cat packages/mobile/eas.json
```

3. Clear EAS cache:
```bash
eas build --platform ios --clear-cache
```

4. Check build logs:
```bash
eas build:list
# Click on failed build to view logs
```

## API Connection Issues

### Issue: Cannot connect to backend API

**Symptoms:**
- Network errors
- CORS errors
- Connection refused

**Solutions:**

1. Verify backend is running:
```bash
curl http://localhost:3001/api/health
```

2. Check API URL in environment:
```bash
# Web
cat packages/web/.env

# Mobile
grep baseURL packages/mobile/App.tsx
```

3. For mobile on physical device, use computer's IP:
```typescript
// App.tsx
configureAPIClient({
  baseURL: 'http://192.168.1.100:3001/api',  // Your computer's IP
  // ...
});
```

4. For Android emulator, use special IP:
```typescript
configureAPIClient({
  baseURL: 'http://10.0.2.2:3001/api',  // Android emulator
  // ...
});
```

### Issue: CORS errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Preflight request failures
- 403 Forbidden errors

**Solutions:**

1. Check backend CORS configuration
2. Verify API URL includes protocol:
```typescript
// Correct
baseURL: 'http://localhost:3001/api'

// Incorrect
baseURL: 'localhost:3001/api'
```

3. Check for trailing slashes:
```typescript
// Consistent
baseURL: 'http://localhost:3001/api'  // No trailing slash
```

### Issue: WebSocket connection fails

**Symptoms:**
- Real-time features not working
- WebSocket connection errors
- Reconnection loops

**Solutions:**

1. Check WebSocket URL:
```typescript
// Correct protocols
ws://localhost:3001  // Development
wss://api.yourdomain.com  // Production (SSL)
```

2. Verify backend WebSocket server is running

3. Check firewall settings

4. For mobile, use correct IP address (same as API)

## Authentication Issues

### Issue: Login fails with valid credentials

**Symptoms:**
- Login button does nothing
- "Invalid credentials" error
- Network errors on login

**Solutions:**

1. Check API connection (see above)

2. Verify credentials in backend

3. Check browser console for errors

4. Clear stored tokens:
```typescript
// Web: Clear localStorage
localStorage.clear();

// Mobile: Clear AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.clear();
```

### Issue: Token refresh fails

**Symptoms:**
- Logged out unexpectedly
- 401 Unauthorized errors
- Infinite refresh loops

**Solutions:**

1. Check token expiration times in backend

2. Verify refresh token endpoint

3. Check API client configuration:
```typescript
configureAPIClient({
  getTokens: () => {
    // Ensure this returns valid tokens
  },
  saveTokens: (tokens) => {
    // Ensure this saves tokens correctly
  },
  // ...
});
```

### Issue: Biometric authentication not working

**Symptoms:**
- Biometric prompt doesn't appear
- "Not available" error
- Authentication fails

**Solutions:**

1. Check device has biometric hardware

2. Verify biometric is enrolled in device settings

3. Check permissions in app.json:
```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "..."
    }
  },
  "android": {
    "permissions": ["USE_BIOMETRIC"]
  }
}
```

4. Test on physical device (not simulator)

## Mobile-Specific Issues

### Issue: Camera not working

**Symptoms:**
- Camera permission denied
- Black screen when opening camera
- Cannot take photos

**Solutions:**

1. Check permissions in app.json:
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "..."
    }
  },
  "android": {
    "permissions": ["CAMERA"]
  }
}
```

2. Request permissions at runtime:
```typescript
import { Camera } from 'expo-camera';
const { status } = await Camera.requestCameraPermissionsAsync();
```

3. Test on physical device (camera not available in simulator)

### Issue: Push notifications not working

**Symptoms:**
- Notifications not received
- Permission denied
- Token registration fails

**Solutions:**

1. Check notification permissions:
```typescript
import * as Notifications from 'expo-notifications';
const { status } = await Notifications.requestPermissionsAsync();
```

2. Verify Expo push token is registered

3. Check notification handler configuration:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

4. Test on physical device (push notifications not available in simulator)

### Issue: App crashes on startup

**Symptoms:**
- White screen
- Immediate crash
- Error boundary triggered

**Solutions:**

1. Check error logs:
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

2. Clear Metro cache:
```bash
npx expo start --clear
```

3. Reinstall app on device

4. Check for missing dependencies:
```bash
npm install
```

## Performance Issues

### Issue: Slow page load times

**Symptoms:**
- Long initial load
- Slow navigation
- Laggy UI

**Solutions:**

1. Enable code splitting:
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

2. Optimize images:
- Use WebP format
- Compress images
- Lazy load images

3. Check bundle size:
```bash
npm run build:web
# Check dist/ folder size
```

4. Use React DevTools Profiler to identify slow components

### Issue: Memory leaks

**Symptoms:**
- Increasing memory usage
- App becomes slow over time
- Crashes after extended use

**Solutions:**

1. Clean up useEffect hooks:
```typescript
useEffect(() => {
  const subscription = api.subscribe();
  
  return () => {
    subscription.unsubscribe();  // Cleanup
  };
}, []);
```

2. Unsubscribe from WebSocket events:
```typescript
useEffect(() => {
  websocketService.on('event', handler);
  
  return () => {
    websocketService.off('event', handler);  // Cleanup
  };
}, []);
```

3. Use React DevTools to detect memory leaks

### Issue: Slow API requests

**Symptoms:**
- Long loading times
- Timeouts
- Poor user experience

**Solutions:**

1. Enable React Query caching:
```typescript
useQuery(['key'], fetchData, {
  staleTime: 5 * 60 * 1000,  // 5 minutes
});
```

2. Implement pagination:
```typescript
useInfiniteQuery(['key'], fetchPage, {
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

3. Optimize backend queries

4. Use loading skeletons for better UX

## Deployment Issues

### Issue: Vercel/Netlify build fails

**Symptoms:**
- Build errors in CI
- Deployment fails
- Environment variables not found

**Solutions:**

1. Check build command:
```json
{
  "buildCommand": "npm run build:web"
}
```

2. Verify environment variables are set in dashboard

3. Check Node.js version:
```json
{
  "engines": {
    "node": "18.x"
  }
}
```

4. Review build logs for specific errors

### Issue: EAS build fails

**Symptoms:**
- Build errors
- Credential issues
- Timeout errors

**Solutions:**

1. Check EAS configuration:
```bash
cat packages/mobile/eas.json
```

2. Verify credentials:
```bash
eas credentials
```

3. Clear cache and retry:
```bash
eas build --platform ios --clear-cache
```

4. Check build logs in Expo dashboard

### Issue: App Store/Play Store rejection

**Symptoms:**
- App rejected during review
- Compliance issues
- Missing information

**Solutions:**

1. Review rejection reason carefully

2. Common issues:
   - Missing privacy policy
   - Incomplete app information
   - Crashes during review
   - Missing permissions descriptions

3. Update app.json with required information

4. Test app thoroughly before resubmission

## Debugging Tips

### Enable Debug Mode

**Web:**
```typescript
// Add to main.tsx
if (import.meta.env.DEV) {
  console.log('Debug mode enabled');
}
```

**Mobile:**
```typescript
// Add to App.tsx
if (__DEV__) {
  console.log('Debug mode enabled');
}
```

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools
3. Use Components and Profiler tabs

### Network Debugging

**Web:**
1. Open browser DevTools
2. Go to Network tab
3. Filter by XHR/Fetch
4. Inspect requests and responses

**Mobile:**
1. Shake device to open debug menu
2. Enable "Debug JS Remotely"
3. Open Chrome DevTools
4. Use Network tab

### Redux DevTools (for Zustand)

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({
    // store implementation
  }))
);
```

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Search existing issues on GitHub
3. Check documentation
4. Review error logs
5. Try to reproduce the issue

### When Asking for Help

Include:
1. Clear description of the issue
2. Steps to reproduce
3. Expected vs actual behavior
4. Error messages and logs
5. Environment details (OS, Node version, etc.)
6. Screenshots if applicable

### Support Channels

- GitHub Issues: Bug reports and feature requests
- Team Chat: Quick questions and discussions
- Documentation: Guides and references
- Stack Overflow: Community support

## Common Error Messages

### "Module not found"

**Cause:** Missing dependency or incorrect import path

**Solution:**
```bash
npm install <missing-package>
```

### "Cannot find module '@horizon-hcm/shared'"

**Cause:** Shared package not built

**Solution:**
```bash
npm run build:shared
```

### "Port 3000 is already in use"

**Cause:** Another process using the port

**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev:web
```

### "Expo token is required"

**Cause:** Not logged in to Expo

**Solution:**
```bash
eas login
```

### "Unable to resolve module"

**Cause:** Metro bundler cache issue

**Solution:**
```bash
npx expo start --clear
```

## Prevention Tips

1. **Keep dependencies updated:**
```bash
npm outdated
npm update
```

2. **Run tests before committing:**
```bash
npm test
```

3. **Use TypeScript strict mode:**
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

4. **Follow code style:**
```bash
npm run lint
npm run format
```

5. **Review changes before pushing:**
```bash
git diff
```

6. **Test on multiple devices/browsers**

7. **Monitor error tracking (Sentry)**

8. **Keep documentation updated**
