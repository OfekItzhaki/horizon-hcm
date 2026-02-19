import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../services/webhook.service';
import axios from 'axios';

@Processor('webhooks', {
  concurrency: 5,
})
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { deliveryId } = job.data;

    this.logger.log(`Processing webhook delivery: ${deliveryId}`);

    try {
      // Get delivery and webhook details
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { webhook: true },
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      if (!delivery.webhook.is_active) {
        this.logger.warn(`Webhook ${delivery.webhook_id} is inactive, skipping`);
        return;
      }

      // Increment attempt count
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { attempts: delivery.attempts + 1 },
      });

      // Prepare payload
      const payload = {
        event: delivery.event_type,
        data: delivery.payload,
        timestamp: delivery.created_at,
        delivery_id: deliveryId,
      };

      // Sign payload
      const signature = this.webhookService.signPayload(
        payload,
        delivery.webhook.secret,
      );

      // Send webhook request
      const response = await axios.post(delivery.webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event_type,
          'X-Webhook-Delivery': deliveryId,
        },
        timeout: 10000, // 10 second timeout
      });

      // Mark as successful
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'success',
          response: JSON.stringify({
            status: response.status,
            data: response.data,
          }),
          delivered_at: new Date(),
        },
      });

      this.logger.log(`Webhook delivery successful: ${deliveryId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Webhook delivery failed: ${deliveryId} - ${error.message}`,
      );

      // Get current delivery to check attempts
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
      });

      const maxAttempts = 5;
      const shouldRetry = delivery && delivery.attempts < maxAttempts;

      // Update delivery status
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: shouldRetry ? 'pending' : 'failed',
          error: error.message,
          response: error.response
            ? JSON.stringify({
                status: error.response.status,
                data: error.response.data,
              })
            : null,
        },
      });

      if (shouldRetry) {
        // Throw error to trigger BullMQ retry with exponential backoff
        throw error;
      }

      return { success: false, error: error.message };
    }
  }
}
