import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore, useWebSocketStore } from '../store';
import { authApi } from '@horizon-hcm/shared';
import { queryClient } from '../lib/query-client';

export function useLogout() {
  const navigate = useNavigate();
  const authLogout = useAuthStore((state) => state.logout);
  const resetUnreadCount = useNotificationStore((state) => state.resetUnreadCount);
  const disconnectWebSocket = useWebSocketStore((state) => state.disconnect);

  const logout = async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Disconnect WebSocket
      disconnectWebSocket();

      // Clear all stores
      authLogout();
      resetUnreadCount();

      // Clear React Query cache
      queryClient.clear();

      // Redirect to login
      navigate('/login', { replace: true });
    }
  };

  return logout;
}
