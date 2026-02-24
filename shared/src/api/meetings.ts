import { apiClient } from './client';
import type { Meeting } from '../types';

// Meetings API
export const meetingsApi = {
  getAll: (
    buildingId: string,
    params?: {
      status?: 'upcoming' | 'past' | 'cancelled';
      page?: number;
      limit?: number;
    }
  ) =>
    apiClient.get<{ data: Meeting[]; total: number; page: number; limit: number }>(
      `/buildings/${buildingId}/meetings`,
      { params }
    ),

  getById: (buildingId: string, meetingId: string) =>
    apiClient.get<Meeting>(`/buildings/${buildingId}/meetings/${meetingId}`),

  create: (buildingId: string, data: FormData) =>
    apiClient.post<Meeting>(`/buildings/${buildingId}/meetings`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (buildingId: string, meetingId: string, data: Partial<Meeting>) =>
    apiClient.patch<Meeting>(`/buildings/${buildingId}/meetings/${meetingId}`, data),

  cancel: (buildingId: string, meetingId: string, reason?: string) =>
    apiClient.patch<Meeting>(`/buildings/${buildingId}/meetings/${meetingId}/cancel`, { reason }),

  delete: (buildingId: string, meetingId: string) =>
    apiClient.delete(`/buildings/${buildingId}/meetings/${meetingId}`),

  rsvp: (buildingId: string, meetingId: string, status: 'attending' | 'not_attending' | 'maybe') =>
    apiClient.post(`/buildings/${buildingId}/meetings/${meetingId}/rsvp`, { status }),

  getAttendees: (buildingId: string, meetingId: string) =>
    apiClient.get<{
      attending: Array<{ id: string; name: string; email: string }>;
      notAttending: Array<{ id: string; name: string; email: string }>;
      maybe: Array<{ id: string; name: string; email: string }>;
    }>(`/buildings/${buildingId}/meetings/${meetingId}/attendees`),

  addMinutes: (buildingId: string, meetingId: string, data: FormData) =>
    apiClient.post(`/buildings/${buildingId}/meetings/${meetingId}/minutes`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMinutes: (buildingId: string, meetingId: string) =>
    apiClient.get<{
      content: string;
      attachments: string[];
      publishedAt: string;
      publishedBy: string;
    }>(`/buildings/${buildingId}/meetings/${meetingId}/minutes`),

  downloadAgenda: (buildingId: string, meetingId: string) =>
    apiClient.get(`/buildings/${buildingId}/meetings/${meetingId}/agenda/download`, {
      responseType: 'blob',
    }),

  generateICalendar: (buildingId: string, meetingId: string) =>
    apiClient.get(`/buildings/${buildingId}/meetings/${meetingId}/icalendar`, {
      responseType: 'blob',
    }),
};
