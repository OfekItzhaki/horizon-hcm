import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommandBus } from '@nestjs/cqrs';
import * as crypto from 'crypto';
import { generateId } from '../../common/utils/id-generator';

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  createdBy: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * Register a new webhook
   */
  async registerWebhook(config: WebhookConfig): Promise<string> {
    try {
      // Generate secret if not provided
      const secret = config.secret || this.generateSecret();

      const webhook = await this.prisma.webhooks.create({
        data: {
          id: generateId(),
          url: config.url,
          events: config.events,
          secret,
          created_by: config.createdBy,
          is_active: true,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Webhook registered: ${webhook.id} for ${config.url}`);

      return webhook.id;
    } catch (error) {
      this.logger.error(`Failed to register webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<void> {
    try {
      await this.prisma.webhooks.update({
        where: { id: webhookId },
        data: {
          url: updates.url,
          events: updates.events,
          is_active: updates.secret !== undefined ? true : undefined,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Webhook updated: ${webhookId}`);
    } catch (error) {
      this.logger.error(`Failed to update webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.prisma.webhooks.delete({
        where: { id: webhookId },
      });

      this.logger.log(`Webhook deleted: ${webhookId}`);
    } catch (error) {
      this.logger.error(`Failed to delete webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string) {
    return await this.prisma.webhooks.findUnique({
      where: { id: webhookId },
      include: {
        webhook_deliveries: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * List all webhooks for a user
   */
  async listWebhooks(userId: string) {
    return await this.prisma.webhooks.findMany({
      where: { created_by: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(event: WebhookEvent): Promise<void> {
    try {
      // Find all active webhooks subscribed to this event type
      const webhooks = await this.prisma.webhooks.findMany({
        where: {
          is_active: true,
          events: {
            has: event.type,
          },
        },
      });

      if (webhooks.length === 0) {
        this.logger.debug(`No webhooks subscribed to event: ${event.type}`);
        return;
      }

      this.logger.log(`Triggering ${webhooks.length} webhooks for event: ${event.type}`);

      // Create delivery records and queue for processing
      for (const webhook of webhooks) {
        await this.createDelivery(webhook.id, event);
      }
    } catch (error) {
      this.logger.error(`Failed to trigger webhooks: ${error.message}`);
    }
  }

  /**
   * Create webhook delivery record
   */
  private async createDelivery(webhookId: string, event: WebhookEvent): Promise<string> {
    const delivery = await this.prisma.webhook_deliveries.create({
      data: {
        id: generateId(),
        webhook_id: webhookId,
        event_type: event.type,
        payload: event.data,
        status: 'pending',
        attempts: 0,
      },
    });

    // Queue for async delivery (will be handled by webhook processor)
    this.logger.log(`Webhook delivery queued: ${delivery.id}`);

    return delivery.id;
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(webhookId: string, limit: number = 50) {
    return await this.prisma.webhook_deliveries.findMany({
      where: { webhook_id: webhookId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Retry failed webhook delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    try {
      const delivery = await this.prisma.webhook_deliveries.findUnique({
        where: { id: deliveryId },
        include: { webhooks: true },
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      if (delivery.status === 'success') {
        throw new Error('Cannot retry successful delivery');
      }

      // Reset status to pending for retry
      await this.prisma.webhook_deliveries.update({
        where: { id: deliveryId },
        data: {
          status: 'pending',
          error: null,
        },
      });

      this.logger.log(`Webhook delivery retry queued: ${deliveryId}`);
    } catch (error) {
      this.logger.error(`Failed to retry delivery: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sign webhook payload with HMAC
   */
  signPayload(payload: any, secret: string): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.signPayload(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Generate random secret for webhook
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId: string) {
    const [totalDeliveries, successCount, failedCount, pendingCount] = await Promise.all([
      this.prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId },
      }),
      this.prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId, status: 'success' },
      }),
      this.prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId, status: 'failed' },
      }),
      this.prisma.webhook_deliveries.count({
        where: { webhook_id: webhookId, status: 'pending' },
      }),
    ]);

    return {
      totalDeliveries,
      successCount,
      failedCount,
      pendingCount,
      successRate:
        totalDeliveries > 0 ? ((successCount / totalDeliveries) * 100).toFixed(2) : '0.00',
    };
  }
}
