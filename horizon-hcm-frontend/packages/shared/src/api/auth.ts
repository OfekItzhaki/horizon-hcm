import { apiClient } from './client';
import type { AuthTokens, User, LoginCredentials, RegisterData } from '../types';

export const authApi = {
  login: (credentials: LoginCredentials) => apiClient.post<AuthTokens>('/auth/login', credentials),

  register: (data: RegisterData) => apiClient.post<User>('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/password-reset/request', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/password-reset/complete', { token, newPassword: password }),

  setup2FA: () => apiClient.post<{ qrCode: string; manualCode: string }>('/auth/2fa/setup'),

  verify2FA: (code: string) => apiClient.post('/auth/2fa/verify', { code }),

  disable2FA: (password: string) => apiClient.post('/auth/2fa/disable', { password }),

  getCurrentUser: () => apiClient.get<User>('/auth/me'),
};
