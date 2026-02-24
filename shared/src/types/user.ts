// User and Authentication Types

export type UserRole = 'committee_member' | 'owner' | 'tenant' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  buildings: string[]; // Building IDs
  apartments: ApartmentAssociation[];
  language: 'en' | 'he';
  theme: 'light' | 'dark';
  notificationPreferences: NotificationPreferences;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApartmentAssociation {
  apartmentId: string;
  buildingId: string;
  role: 'owner' | 'tenant';
  moveInDate: Date;
  moveOutDate?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  acceptedTerms: boolean;
  tenantId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  enabledTypes: NotificationType[];
}

export type NotificationType =
  | 'invoice_created'
  | 'payment_received'
  | 'announcement_published'
  | 'poll_created'
  | 'maintenance_status_changed'
  | 'meeting_scheduled'
  | 'meeting_reminder'
  | 'message_received'
  | 'document_uploaded';
