import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketStore, useAuthStore, useNotificationStore } from '../store';
import { queryKeys } from '../lib/query-keys';
import { WEBSOCKET_EVENTS } from '@horizon-hcm/shared';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { connect, disconnect, on, socket } = useWebSocketStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { incrementUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated) {
      disconnect();
      return;
    }

    // Connect to WebSocket
    connect();

    // Set up event listeners after connection
    if (socket) {
      // New notification event
      on(WEBSOCKET_EVENTS.NEW_NOTIFICATION, (data) => {
        console.log('[WebSocket] New notification:', data);
        // Invalidate notifications query to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        // Increment unread count
        incrementUnreadCount();
      });

      // New message event
      on(WEBSOCKET_EVENTS.NEW_MESSAGE, (data) => {
        console.log('[WebSocket] New message:', data);
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      });

      // New announcement event
      on(WEBSOCKET_EVENTS.NEW_ANNOUNCEMENT, (data) => {
        console.log('[WebSocket] New announcement:', data);
        // Invalidate announcements query to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      });

      // Maintenance update event
      on(WEBSOCKET_EVENTS.MAINTENANCE_UPDATE, (data) => {
        console.log('[WebSocket] Maintenance update:', data);
        // Invalidate maintenance queries
        queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
        if (data.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.detail(data.id) });
        }
      });

      // Poll update event
      on(WEBSOCKET_EVENTS.POLL_UPDATE, (data) => {
        console.log('[WebSocket] Poll update:', data);
        // Invalidate polls queries
        queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
        if (data.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.polls.detail(data.id) });
        }
      });
    }

    // Cleanup on unmount or when authentication changes
    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect, on, socket, queryClient, incrementUnreadCount]);

  return useWebSocketStore();
}
