import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketStore, useAuthStore, useNotificationStore } from '../store';
import { queryKeys } from '../lib/query-keys';
import { WEBSOCKET_EVENTS } from '@horizon-hcm/shared';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { incrementUnreadCount } = useNotificationStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated) {
      if (hasInitialized.current) {
        useWebSocketStore.getState().disconnect();
        hasInitialized.current = false;
      }
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Connect to WebSocket
    useWebSocketStore.getState().connect();

    // Get socket from store
    const socket = useWebSocketStore.getState().socket;

    // Set up event listeners after connection
    if (socket) {
      // New notification event
      socket.on(WEBSOCKET_EVENTS.NEW_NOTIFICATION, (data: any) => {
        console.log('[WebSocket] New notification:', data);
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        incrementUnreadCount();
      });

      // New message event
      socket.on(WEBSOCKET_EVENTS.NEW_MESSAGE, (data: any) => {
        console.log('[WebSocket] New message:', data);
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      });

      // New announcement event
      socket.on(WEBSOCKET_EVENTS.NEW_ANNOUNCEMENT, (data: any) => {
        console.log('[WebSocket] New announcement:', data);
        queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      });

      // Maintenance update event
      socket.on(WEBSOCKET_EVENTS.MAINTENANCE_UPDATE, (data: any) => {
        console.log('[WebSocket] Maintenance update:', data);
        queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
        if (data.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.detail(data.id) });
        }
      });

      // Poll update event
      socket.on(WEBSOCKET_EVENTS.POLL_UPDATE, (data: any) => {
        console.log('[WebSocket] Poll update:', data);
        queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
        if (data.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.polls.detail(data.id) });
        }
      });
    }

    // Cleanup on unmount
    return () => {
      useWebSocketStore.getState().disconnect();
      hasInitialized.current = false;
    };
  }, [isAuthenticated, queryClient, incrementUnreadCount]);

  return useWebSocketStore();
}
