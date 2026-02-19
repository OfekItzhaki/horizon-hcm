export enum NotificationProvider {
  FCM = 'fcm',
  APNS = 'apns',
  WEB_PUSH = 'web-push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRY = 'retry',
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  silent?: boolean;
  imageUrl?: string;
  clickAction?: string;
}

export interface SendNotificationDto {
  userId?: string;
  deviceToken?: string;
  provider: NotificationProvider;
  payload: NotificationPayload;
  template?: string;
  variables?: Record<string, string>;
  language?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
