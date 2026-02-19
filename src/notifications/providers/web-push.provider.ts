import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { LoggerService } from '../../common/logger/logger.service';
import {
  NotificationPayload,
  NotificationResult,
} from '../interfaces/notification.interface';

@Injectable()
export class WebPushProvider implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  onModuleInit() {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.configService.get<string>('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      this.logger.warn(
        'VAPID keys not configured. Web Push notifications will not work.',
        'WebPushProvider',
      );
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    this.logger.log('Web Push Provider initialized', 'WebPushProvider');
  }

  async send(
    subscription: string,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    try {
      // Parse subscription (should be JSON string)
      const subscriptionObject = JSON.parse(subscription);

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.imageUrl,
        data: payload.data,
        silent: payload.silent,
      });

      await webpush.sendNotification(subscriptionObject, notificationPayload);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Web Push send error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBatch(
    subscriptions: string[],
    payload: NotificationPayload,
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const subscription of subscriptions) {
      const result = await this.send(subscription, payload);
      results.push(result);
    }

    return results;
  }
}
