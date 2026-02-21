import { apiClient } from './client';
import type { User, Notification } from '../types';

// Users API (Profile and Preferences)
export const usersApi = {
  getProfile: () => apiClient.get<User>('/users/profile'),

  updateProfile: (data: { name?: string; email?: string; phone?: string; avatar?: string }) =>
    apiClient.patch<User>('/users/profile', data),

  uploadAvatar: (data: FormData) =>
    apiClient.post<{ avatarUrl: string }>('/users/profile/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/users/profile/password', data),

  getPreferences: () =>
    apiClient.get<{
      language: string;
      theme: string;
      notifications: {
        email: boolean;
        push: boolean;
        announcements: boolean;
        messages: boolean;
        invoices: boolean;
        maintenance: boolean;
        meetings: boolean;
      };
    }>('/users/preferences'),

  updatePreferences: (data: {
    language?: string;
    theme?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      announcements?: boolean;
      messages?: boolean;
      invoices?: boolean;
      maintenance?: boolean;
      meetings?: boolean;
    };
  }) => apiClient.patch('/users/preferences', data),

  getBuildings: () =>
    apiClient.get<Array<{ id: string; name: string; address: string; role: string }>>(
      '/users/buildings'
    ),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
    apiClient.get<{
      data: Notification[];
      total: number;
      unreadCount: number;
      page: number;
      limit: number;
    }>('/notifications', { params }),

  markAsRead: (notificationId: string) => apiClient.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: () => apiClient.post('/notifications/read-all'),

  delete: (notificationId: string) => apiClient.delete(`/notifications/${notificationId}`),

  getUnreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),

  registerPushToken: (token: string, platform: 'ios' | 'android' | 'web') =>
    apiClient.post('/notifications/push-token', { token, platform }),

  unregisterPushToken: (token: string) =>
    apiClient.delete('/notifications/push-token', { data: { token } }),
};
