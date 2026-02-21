import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@horizon-hcm/shared';
import { queryKeys } from '../lib/query-keys';
import { useNotificationStore } from '../store';

export function useNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: async () => {
      const response = await notificationsApi.getAll(params);
      // Update unread count in store
      setUnreadCount(response.data.unreadCount);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { decrementUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      // Decrement unread count
      decrementUnreadCount();
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { resetUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      // Reset unread count
      resetUnreadCount();
    },
  });
}

export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.data.count);
      return response.data.count;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
