import { apiClient } from './client';
import type { MaintenanceRequest } from '../types';

// Maintenance Requests API
export const maintenanceApi = {
  getAll: (
    buildingId: string,
    params?: {
      status?: string;
      category?: string;
      priority?: string;
      page?: number;
      limit?: number;
    }
  ) =>
    apiClient.get<{ data: MaintenanceRequest[]; total: number; page: number; limit: number }>(
      `/buildings/${buildingId}/maintenance`,
      { params }
    ),

  getById: (buildingId: string, requestId: string) =>
    apiClient.get<MaintenanceRequest>(`/buildings/${buildingId}/maintenance/${requestId}`),

  create: (buildingId: string, data: FormData) =>
    apiClient.post<MaintenanceRequest>(`/buildings/${buildingId}/maintenance`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (buildingId: string, requestId: string, data: Partial<MaintenanceRequest>) =>
    apiClient.patch<MaintenanceRequest>(`/buildings/${buildingId}/maintenance/${requestId}`, data),

  updateStatus: (buildingId: string, requestId: string, status: string, notes?: string) =>
    apiClient.patch<MaintenanceRequest>(
      `/buildings/${buildingId}/maintenance/${requestId}/status`,
      {
        status,
        notes,
      }
    ),

  addComment: (buildingId: string, requestId: string, comment: string, isInternal?: boolean) =>
    apiClient.post(`/buildings/${buildingId}/maintenance/${requestId}/comments`, {
      comment,
      isInternal,
    }),

  delete: (buildingId: string, requestId: string) =>
    apiClient.delete(`/buildings/${buildingId}/maintenance/${requestId}`),

  getStats: (buildingId: string) =>
    apiClient.get<{
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
      avgResolutionTime: number;
    }>(`/buildings/${buildingId}/maintenance/stats`),
};
