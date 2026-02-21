/**
 * Query Keys Factory Pattern
 * Provides consistent, type-safe query keys for React Query
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },

  // Buildings
  buildings: {
    all: ['buildings'] as const,
    lists: () => [...queryKeys.buildings.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.buildings.lists(), filters] as const,
    details: () => [...queryKeys.buildings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.buildings.details(), id] as const,
  },

  // Apartments
  apartments: {
    all: ['apartments'] as const,
    lists: () => [...queryKeys.apartments.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.apartments.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.apartments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.apartments.details(), id] as const,
  },

  // Residents
  residents: {
    all: ['residents'] as const,
    lists: () => [...queryKeys.residents.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.residents.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.residents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.residents.details(), id] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.invoices.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.payments.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    balance: (buildingId: string, dateRange?: any) =>
      [...queryKeys.reports.all, 'balance', buildingId, dateRange] as const,
    incomeExpense: (buildingId: string, dateRange?: any) =>
      [...queryKeys.reports.all, 'income-expense', buildingId, dateRange] as const,
    budget: (buildingId: string, dateRange?: any) =>
      [...queryKeys.reports.all, 'budget', buildingId, dateRange] as const,
    yearOverYear: (buildingId: string, years?: number[]) =>
      [...queryKeys.reports.all, 'year-over-year', buildingId, years] as const,
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    lists: () => [...queryKeys.announcements.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.announcements.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.announcements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.announcements.details(), id] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.messages.lists(), buildingId, filters] as const,
  },

  // Polls
  polls: {
    all: ['polls'] as const,
    lists: () => [...queryKeys.polls.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.polls.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.polls.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.polls.details(), id] as const,
    results: (id: string) => [...queryKeys.polls.detail(id), 'results'] as const,
  },

  // Maintenance
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.maintenance.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
  },

  // Meetings
  meetings: {
    all: ['meetings'] as const,
    lists: () => [...queryKeys.meetings.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.meetings.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.meetings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.meetings.details(), id] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (buildingId: string, filters?: Record<string, any>) =>
      [...queryKeys.documents.lists(), buildingId, filters] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
};
