import { apiClient } from './client';
import type { Document } from '../types';

// Documents API
export const documentsApi = {
  getAll: (
    buildingId: string,
    params?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) =>
    apiClient.get<{ data: Document[]; total: number; page: number; limit: number }>(
      `/buildings/${buildingId}/documents`,
      { params }
    ),

  getById: (buildingId: string, documentId: string) =>
    apiClient.get<Document>(`/buildings/${buildingId}/documents/${documentId}`),

  upload: (buildingId: string, data: FormData) =>
    apiClient.post<Document>(`/buildings/${buildingId}/documents`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (
    buildingId: string,
    documentId: string,
    data: { name?: string; category?: string; description?: string }
  ) => apiClient.patch<Document>(`/buildings/${buildingId}/documents/${documentId}`, data),

  delete: (buildingId: string, documentId: string) =>
    apiClient.delete(`/buildings/${buildingId}/documents/${documentId}`),

  download: (buildingId: string, documentId: string) =>
    apiClient.get(`/buildings/${buildingId}/documents/${documentId}/download`, {
      responseType: 'blob',
    }),

  getVersionHistory: (buildingId: string, documentId: string) =>
    apiClient.get<Array<{ version: number; uploadedAt: string; uploadedBy: string; size: number }>>(
      `/buildings/${buildingId}/documents/${documentId}/versions`
    ),

  getCategories: (buildingId: string) =>
    apiClient.get<string[]>(`/buildings/${buildingId}/documents/categories`),
};
