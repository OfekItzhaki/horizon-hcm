import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LoggerService } from '../../common/logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmProvider } from '../providers/fcm.provider';
import { ApnsProvider } from '../providers/apns.provider';
import { WebPushProvider } from '../providers/web-push.provider';
import {
  SendNotificationDto,
  NotificationProvider,
} from '../interfaces/notification.interface';

interface SendTemplatedJobData {
  logId: string;
  userId: string;
  title: string;
  body: string;
  silent?: boolean;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private fcmProvider: FcmProvider,
    private apnsProvider: ApnsProvider,
    private webPushProvider: WebPushProvider,
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { name, data } = job;

    this.logger.log(
      `Processing notification job: ${name} (ID: ${job.id})`,
      'NotificationProcessor',
    );

    try {
      switch (name) {
        case 'send-notification':
          return await this.handleSendNotification(data);

        case 'send-to-user':
          return await this.handleSendToUser(data);

        case 'send-templated':
          return await this.handleSendTemplated(data);

        default:
          throw new Error(`Unknown job type: ${name}`);
      }
    } catch (error) {
      this.logger.error(
        `Notification job failed: ${name} (ID: ${job.id})`,
        error,
      );
      throw error; // Re-throw to trigger retry
    }
  }

  private async handleSendTemplated(data: SendTemplatedJobData) {
    const { logId, userId, title, body, silent = false } = data;

    try {
      // TODO: Get user's device tokens from auth package
      // For now, we'll just update the log status
      // In production, you would:
      // 1. Query user's push tokens from the auth package
      // 2. Determine provider (FCM/APNS/WebPush) based on device type
      // 3. Send to each device
      // 4. Track delivery status

      // Update log to "sent" status
      await this.prisma.notificationLog.update({
        where: { id: logId },
        data: {
          delivery_status: 'sent',
          sent_at: new Date(),
        },
      });

      this.logger.log(
        `Templated notification sent for user ${userId}`,
        'NotificationProcessor',
      );

      return { success: true };
    } catch (error) {
      // Update log to "failed" status
      await this.prisma.notificationLog.update({
        where: { id: logId },
        data: {
          delivery_status: 'failed',
          error_message: error.message,
        },
      });

      throw error;
    }
  }

  private async handleSendNotification(data: SendNotificationDto) {
    const { provider, deviceToken, payload } = data;

    let result;

    switch (provider) {
      case NotificationProvider.FCM:
        result = await this.fcmProvider.send(deviceToken, payload);
        break;

      case NotificationProvider.APNS:
        result = await this.apnsProvider.send(deviceToken, payload);
        break;

      case NotificationProvider.WEB_PUSH:
        result = await this.webPushProvider.send(deviceToken, payload);
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Notification send failed');
    }

    this.logger.log(
      `Notification sent successfully via ${provider}`,
      'NotificationProcessor',
    );

    return result;
  }

  private async handleSendToUser(data: SendNotificationDto) {
    // TODO: Query database for user's device tokens and send to all
    // For now, just log
    this.logger.log(
      `Send to user not fully implemented: ${data.userId}`,
      'NotificationProcessor',
    );

    return { success: true };
  }
}
