import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';

type SyncMessage = {
  type: 'LOGOUT' | 'PROFILE_UPDATE' | 'BUILDING_CHANGE' | 'NOTIFICATION_READ' | 'THEME_CHANGE';
  payload?: any;
};

let broadcastChannel: BroadcastChannel | null = null;

export function useCrossTabSync() {
  const logout = useAuthStore((state) => state.logout);
  const setSelectedBuildingId = useAppStore((state) => state.setSelectedBuilding);
  const setTheme = useAppStore((state) => state.setTheme);
  // Note: markAsRead not available in notification store

  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported');
      return;
    }

    // Create broadcast channel
    broadcastChannel = new BroadcastChannel('horizon-hcm-sync');

    // Listen for messages from other tabs
    broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'LOGOUT':
          logout();
          break;
        case 'PROFILE_UPDATE':
          // Trigger profile refetch
          window.location.reload();
          break;
        case 'BUILDING_CHANGE':
          if (payload?.buildingId) {
            setSelectedBuildingId(payload.buildingId);
          }
          break;
        case 'NOTIFICATION_READ':
          // Note: markAsRead not available, would need to be added to store
          break;
        case 'THEME_CHANGE':
          if (payload?.theme) {
            setTheme(payload.theme);
          }
          break;
      }
    };

    return () => {
      broadcastChannel?.close();
      broadcastChannel = null;
    };
  }, []);

  const syncLogout = () => {
    broadcastChannel?.postMessage({ type: 'LOGOUT' });
  };

  const syncProfileUpdate = () => {
    broadcastChannel?.postMessage({ type: 'PROFILE_UPDATE' });
  };

  const syncBuildingChange = (buildingId: string) => {
    broadcastChannel?.postMessage({
      type: 'BUILDING_CHANGE',
      payload: { buildingId },
    });
  };

  const syncNotificationRead = (notificationId: string) => {
    broadcastChannel?.postMessage({
      type: 'NOTIFICATION_READ',
      payload: { notificationId },
    });
  };

  const syncThemeChange = (theme: 'light' | 'dark') => {
    broadcastChannel?.postMessage({
      type: 'THEME_CHANGE',
      payload: { theme },
    });
  };

  return {
    syncLogout,
    syncProfileUpdate,
    syncBuildingChange,
    syncNotificationRead,
    syncThemeChange,
  };
}
