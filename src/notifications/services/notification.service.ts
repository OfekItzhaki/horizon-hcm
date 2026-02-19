import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueryBus } from '@nestjs/cqrs';
import { LoggerService } from '../../common/logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateService } from './template.service';
import { FcmProvider } from '../providers/fcm.provider';
import { ApnsProvider } from '../providers/apns.provider';
import { WebPushProvider } from '../providers/web-push.provider';
import { GetPreferencesQuery } from '../queries/impl/get-preferences.query';
import { GetTemplateQuery } from '../queries/impl/get-template.query';
import {
  SendNotificationDto,
  NotificationProvider,
  NotificationResult,
} from '../interfaces/notification.interface';

export interface SendTemplatedNotificationDto {
  userId: string;
  templateName: string;
  variables: Record<string, any>;
  language?: string;
  silent?: boolean;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
    private fcmProvider: FcmProvider,
    private apnsProvider: ApnsProvider,
    private webPushProvider: WebPushProvider,
    private logger: LoggerService,
    private prisma: PrismaService,
    private templateService: TemplateService,
    private queryBus: QueryBus,
  ) {}

  /**
   * Send templated notification to user
   * Checks preferences, loads template, substitutes variables, and sends
   */
  async sendTemplatedNotification(
    dto: SendTemplatedNotificationDto,
  ): Promise<void> {
    const { userId, templateName, variables, language = 'en', silent = false } = dto;

    try {
      // 1. Check user preferences
      const preferences = await this.queryBus.execute(
        new GetPreferencesQuery(userId),
      );

      // Check if push notifications are enabled
      if (!preferences.push_enabled) {
        this.logger.log(
          `Push notifications disabled for user ${userId}`,
          'NotificationService',
        );
        return;
      }

      // Check template-specific preferences
      const preferenceMap: Record<string, boolean> = {
        payment_reminder: preferences.payment_reminders,
        maintenance_alert: preferences.maintenance_alerts,
        meeting_notification: preferences.meeting_notifications,
        general_announcement: preferences.general_announcements,
      };

      if (templateName in preferenceMap && !preferenceMap[templateName]) {
        this.logger.log(
          `Notification type ${templateName} disabled for user ${userId}`,
          'NotificationService',
        );
        return;
      }

      // 2. Load template
      const template = await this.queryBus.execute(
        new GetTemplateQuery(templateName, language),
      );

      // 3. Substitute variables
      const title = this.templateService.substituteVariables(
        template.title,
        variables,
      );
      const body = this.templateService.substituteVariables(
        template.body,
        variables,
      );

      // 4. Create notification log entry
      const log = await this.prisma.notificationLog.create({
        data: {
          user_id: userId,
          template_name: templateName,
          title,
          body,
          delivery_status: 'pending',
          provider: 'fcm', // Will be updated by processor
        },
      });

      // 5. Queue notification for delivery
      await this.notificationQueue.add(
        'send-templated',
        {
          logId: log.id,
          userId,
          title,
          body,
          silent,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Templated notification queued for user ${userId}`,
        'NotificationService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send templated notification: ${error.message}`,
        'NotificationService',
      );
      throw error;
    }
  }

  /**
   * Send notification to a device
   * Queues the notification for async processing
   */
  async sendToDevice(dto: SendNotificationDto): Promise<void> {
    await this.notificationQueue.add('send-notification', dto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds
      },
    });

    this.logger.log(
      `Notification queued for device: ${dto.deviceToken}`,
      'NotificationService',
    );
  }

  /**
   * Send notification to a user (all their devices)
   * This would query the database for user's device tokens
   */
  async sendToUser(
    userId: string,
    dto: Omit<SendNotificationDto, 'userId' | 'deviceToken'>,
  ): Promise<void> {
    // TODO: Query database for user's device tokens
    // For now, just queue with userId
    await this.notificationQueue.add(
      'send-to-user',
      { ...dto, userId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(
      `Notification queued for user: ${userId}`,
      'NotificationService',
    );
  }

  /**
   * Send notification immediately (synchronous)
   * Use sparingly - prefer queued sending for better reliability
   */
  async sendImmediate(dto: SendNotificationDto): Promise<NotificationResult> {
    const { provider, deviceToken, payload } = dto;

    try {
      let result: NotificationResult;

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
          result = {
            success: false,
            error: `Unknown provider: ${provider}`,
          };
      }

      if (result.success) {
        this.logger.log(
          `Notification sent successfully via ${provider}`,
          'NotificationService',
        );
      } else {
        this.logger.error(
          `Notification failed via ${provider}: ${result.error}`,
          'NotificationService',
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Notification send error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatch(dtos: SendNotificationDto[]): Promise<void> {
    for (const dto of dtos) {
      await this.sendToDevice(dto);
    }

    this.logger.log(
      `Batch of ${dtos.length} notifications queued`,
      'NotificationService',
    );
  }

  /**
   * Update notification log status
   */
  async updateNotificationStatus(
    logId: string,
    status: 'sent' | 'failed' | 'delivered',
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = {
      delivery_status: status,
    };

    if (status === 'sent') {
      updateData.sent_at = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await this.prisma.notificationLog.update({
      where: { id: logId },
      data: updateData,
    });
  }
}
