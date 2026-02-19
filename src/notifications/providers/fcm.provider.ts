import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { LoggerService } from '../../common/logger/logger.service';
import {
  NotificationPayload,
  NotificationResult,
} from '../interfaces/notification.interface';

@Injectable()
export class FcmProvider implements OnModuleInit {
  private app: admin.app.App;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  onModuleInit() {
    const serviceAccountPath = this.configService.get<string>(
      'FCM_SERVICE_ACCOUNT_PATH',
    );

    if (!serviceAccountPath) {
      this.logger.warn(
        'FCM_SERVICE_ACCOUNT_PATH not configured. FCM notifications will not work.',
        'FcmProvider',
      );
      return;
    }

    try {
      const serviceAccount = require(serviceAccountPath);

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.logger.log('FCM Provider initialized', 'FcmProvider');
    } catch (error) {
      this.logger.error('Failed to initialize FCM Provider', error);
    }
  }

  async send(
    deviceToken: string,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    if (!this.app) {
      return {
        success: false,
        error: 'FCM not initialized',
      };
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: payload.silent
          ? undefined
          : {
              title: payload.title,
              body: payload.body,
              imageUrl: payload.imageUrl,
            },
        data: payload.data,
        android: {
          priority: 'high',
          notification: payload.silent
            ? undefined
            : {
                clickAction: payload.clickAction,
              },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: payload.silent ? true : undefined,
            },
          },
        },
      };

      const messageId = await admin.messaging().send(message);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error('FCM send error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBatch(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<NotificationResult[]> {
    if (!this.app) {
      return tokens.map(() => ({
        success: false,
        error: 'FCM not initialized',
      }));
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: payload.silent
          ? undefined
          : {
              title: payload.title,
              body: payload.body,
              imageUrl: payload.imageUrl,
            },
        data: payload.data,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      return response.responses.map((resp, index) => ({
        success: resp.success,
        messageId: resp.messageId,
        error: resp.error?.message,
      }));
    } catch (error) {
      this.logger.error('FCM batch send error', error);
      return tokens.map(() => ({
        success: false,
        error: error.message,
      }));
    }
  }
}
