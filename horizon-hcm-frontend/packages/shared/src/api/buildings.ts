import { apiClient } from './client';
import type { Building, Apartment, Resident } from '../types';

export const buildingsApi = {
  getAll: () => apiClient.get<Building[]>('/buildings'),

  getById: (id: string) => apiClient.get<Building>(`/buildings/${id}`),

  create: (data: Partial<Building>) => apiClient.post<Building>('/buildings', data),

  update: (id: string, data: Partial<Building>) =>
    apiClient.patch<Building>(`/buildings/${id}`, data),

  delete: (id: string) => apiClient.delete(`/buildings/${id}`),
};

export const apartmentsApi = {
  getByBuilding: (buildingId: string) =>
    apiClient.get<Apartment[]>(`/buildings/${buildingId}/apartments`),

  getById: (id: string) => apiClient.get<Apartment>(`/apartments/${id}`),

  create: (buildingId: string, data: Partial<Apartment>) =>
    apiClient.post<Apartment>(`/buildings/${buildingId}/apartments`, data),

  update: (id: string, data: Partial<Apartment>) =>
    apiClient.patch<Apartment>(`/apartments/${id}`, data),

  delete: (id: string) => apiClient.delete(`/apartments/${id}`),

  bulkImport: (buildingId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/buildings/${buildingId}/apartments/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const residentsApi = {
  getByBuilding: (buildingId: string) =>
    apiClient.get<Resident[]>(`/buildings/${buildingId}/residents`),

  getById: (id: string) => apiClient.get<Resident>(`/residents/${id}`),

  create: (data: Partial<Resident>) => apiClient.post<Resident>('/residents', data),

  update: (id: string, data: Partial<Resident>) =>
    apiClient.patch<Resident>(`/residents/${id}`, data),

  delete: (id: string) => apiClient.delete(`/residents/${id}`),
};
