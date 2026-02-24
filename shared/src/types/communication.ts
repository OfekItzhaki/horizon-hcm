// Communication Types

export interface Announcement {
  id: string;
  buildingId: string;
  title: string;
  content: string;
  priority: 'urgent' | 'normal' | 'low';
  targetAudience: TargetAudience;
  requiresConfirmation: boolean;
  scheduledFor?: Date;
  publishedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  readBy: string[];
  confirmedBy: string[];
}

export interface TargetAudience {
  type: 'all' | 'owners' | 'tenants' | 'specific';
  apartmentIds?: string[];
}

export interface Message {
  id: string;
  buildingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments: MessageAttachment[];
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
}

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}
