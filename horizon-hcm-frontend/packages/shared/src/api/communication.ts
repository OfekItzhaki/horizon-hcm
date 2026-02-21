import { apiClient } from './client';
import type { Announcement, Message, Poll, Vote } from '../types';

// Announcements API
export const announcementsApi = {
  getAll: (buildingId: string, params?: { priority?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: Announcement[]; total: number; page: number; limit: number }>(
      `/buildings/${buildingId}/announcements`,
      { params }
    ),

  getById: (buildingId: string, announcementId: string) =>
    apiClient.get<Announcement>(`/buildings/${buildingId}/announcements/${announcementId}`),

  create: (buildingId: string, data: Partial<Announcement>) =>
    apiClient.post<Announcement>(`/buildings/${buildingId}/announcements`, data),

  update: (buildingId: string, announcementId: string, data: Partial<Announcement>) =>
    apiClient.patch<Announcement>(`/buildings/${buildingId}/announcements/${announcementId}`, data),

  delete: (buildingId: string, announcementId: string) =>
    apiClient.delete(`/buildings/${buildingId}/announcements/${announcementId}`),

  markAsRead: (buildingId: string, announcementId: string) =>
    apiClient.post(`/buildings/${buildingId}/announcements/${announcementId}/read`),

  confirmRead: (buildingId: string, announcementId: string) =>
    apiClient.post(`/buildings/${buildingId}/announcements/${announcementId}/confirm`),

  getStats: (buildingId: string, announcementId: string) =>
    apiClient.get<{ totalRecipients: number; readCount: number; confirmedCount: number }>(
      `/buildings/${buildingId}/announcements/${announcementId}/stats`
    ),
};

// Messages API
export const messagesApi = {
  getAll: (buildingId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Message[]; total: number; page: number; limit: number }>(
      `/buildings/${buildingId}/messages`,
      { params }
    ),

  send: (
    buildingId: string,
    data: { recipientId: string; content: string; attachments?: string[] }
  ) => apiClient.post<Message>(`/buildings/${buildingId}/messages`, data),

  markAsRead: (buildingId: string, messageId: string) =>
    apiClient.post(`/buildings/${buildingId}/messages/${messageId}/read`),

  delete: (buildingId: string, messageId: string) =>
    apiClient.delete(`/buildings/${buildingId}/messages/${messageId}`),
};

// Polls API
export const pollsApi = {
  getAll: (buildingId: string, params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: Poll[]; total: number; page: number; limit: number }>(
      `/buildings/${buildingId}/polls`,
      { params }
    ),

  getById: (buildingId: string, pollId: string) =>
    apiClient.get<Poll>(`/buildings/${buildingId}/polls/${pollId}`),

  create: (buildingId: string, data: Partial<Poll>) =>
    apiClient.post<Poll>(`/buildings/${buildingId}/polls`, data),

  update: (buildingId: string, pollId: string, data: Partial<Poll>) =>
    apiClient.patch<Poll>(`/buildings/${buildingId}/polls/${pollId}`, data),

  delete: (buildingId: string, pollId: string) =>
    apiClient.delete(`/buildings/${buildingId}/polls/${pollId}`),

  vote: (buildingId: string, pollId: string, data: { optionIds: string[] }) =>
    apiClient.post<Vote>(`/buildings/${buildingId}/polls/${pollId}/vote`, data),

  getResults: (buildingId: string, pollId: string) =>
    apiClient.get<{
      options: Array<{ id: string; text: string; voteCount: number; percentage: number }>;
    }>(`/buildings/${buildingId}/polls/${pollId}/results`),

  getVotes: (buildingId: string, pollId: string) =>
    apiClient.get<{ data: Vote[] }>(`/buildings/${buildingId}/polls/${pollId}/votes`),
};
