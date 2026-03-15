import { apiClient } from './client';

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export const adminApi = {
  getAuditLogs: (params?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<AuditLogsResponse>('/admin/audit-logs', { params }),

  getUsers: (params?: { search?: string; limit?: number; offset?: number }) =>
    apiClient.get<AdminUsersResponse>('/admin/users', { params }),
};
