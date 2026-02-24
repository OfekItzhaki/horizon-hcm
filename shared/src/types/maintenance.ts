// Maintenance Types

export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'structural'
  | 'cleaning'
  | 'other';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

export interface MaintenanceRequest {
  id: string;
  buildingId: string;
  apartmentId: string;
  requesterId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: MaintenanceStatus;
  photos: string[];
  assignedTo?: string;
  comments: Comment[];
  internalNotes: InternalNote[];
  trackingNumber: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface InternalNote {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}
