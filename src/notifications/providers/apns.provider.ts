import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as apn from 'apn';
import { LoggerService } from '../../common/logger/logger.service';
import {
  NotificationPayload,
  NotificationResult,
} from '../interfaces/notification.interface';

@Injectable()
export class ApnsProvider implements OnModuleInit, OnModuleDestroy {
  private provider: apn.Provider;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  onModuleInit() {
    const keyPath = this.configService.get<string>('APNS_KEY_PATH');
    const keyId = this.configService.get<string>('APNS_KEY_ID');
    const teamId = this.configService.get<string>('APNS_TEAM_ID');

    if (!keyPath || !keyId || !teamId) {
      this.logger.warn(
        'APNS credentials not configured. APNS notifications will not work.',
        'ApnsProvider',
      );
      return;
    }

    try {
      this.provider = new apn.Provider({
        token: {
          key: keyPath,
          keyId: keyId,
          teamId: teamId,
        },
        production: this.configService.get<string>('NODE_ENV') === 'production',
      });

      this.logger.log('APNS Provider initialized', 'ApnsProvider');
    } catch (error) {
      this.logger.error('Failed to initialize APNS Provider', error);
    }
  }

  onModuleDestroy() {
    if (this.provider) {
      this.provider.shutdown();
    }
  }

  async send(
    deviceToken: string,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    if (!this.provider) {
      return {
        success: false,
        error: 'APNS not initialized',
      };
    }

    try {
      const notification = new apn.Notification();

      if (payload.silent) {
        notification.contentAvailable = true;
        // pushType is not available in older apn versions
      } else {
        notification.alert = {
          title: payload.title,
          body: payload.body,
        };
        notification.sound = 'default';
        notification.badge = 1;
      }

      if (payload.data) {
        notification.payload = payload.data;
      }

      const result = await this.provider.send(notification, deviceToken);

      if (result.failed.length > 0) {
        const error = result.failed[0].response;
        return {
          success: false,
          error: error.reason,
        };
      }

      return {
        success: true,
        messageId: result.sent[0]?.device,
      };
    } catch (error) {
      this.logger.error('APNS send error', error);
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
    if (!this.provider) {
      return tokens.map(() => ({
        success: false,
        error: 'APNS not initialized',
      }));
    }

    try {
      const notification = new apn.Notification();

      if (payload.silent) {
        notification.contentAvailable = true;
        // pushType is not available in older apn versions
      } else {
        notification.alert = {
          title: payload.title,
          body: payload.body,
        };
        notification.sound = 'default';
        notification.badge = 1;
      }

      if (payload.data) {
        notification.payload = payload.data;
      }

      const result = await this.provider.send(notification, tokens);

      return tokens.map((token) => {
        const failed = result.failed.find((f) => f.device === token);
        if (failed) {
          return {
            success: false,
            error: failed.response.reason,
          };
        }

        return {
          success: true,
          messageId: token,
        };
      });
    } catch (error) {
      this.logger.error('APNS batch send error', error);
      return tokens.map(() => ({
        success: false,
        error: error.message,
      }));
    }
  }
}
