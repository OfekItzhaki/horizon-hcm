// Shim: redirect shared store imports to web-app's own stores
// This prevents the shared package's stores from conflicting with web-app stores
export { useAuthStore, useAppStore, useNotificationStore } from '../store';
