import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './services/webhook.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

class RegisterWebhookDto {
  url: string;
  events: string[];
  secret?: string;
}

class UpdateWebhookDto {
  url?: string;
  events?: string[];
  isActive?: boolean;
}

class TriggerWebhookDto {
  eventType: string;
  data: any;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhookService: WebhookService,
    @InjectQueue('webhooks') private readonly webhookQueue: Queue,
  ) {}

  /**
   * Register a new webhook
   */
  @Post()
  @ApiOperation({ summary: 'Register a new webhook' })
  async registerWebhook(
    @Body() dto: RegisterWebhookDto,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return { error: 'userId is required' };
    }

    const webhookId = await this.webhookService.registerWebhook({
      url: dto.url,
      events: dto.events,
      secret: dto.secret,
      createdBy: userId,
    });

    const webhook = await this.webhookService.getWebhook(webhookId);

    return {
      message: 'Webhook registered successfully',
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.is_active,
        createdAt: webhook.created_at,
      },
    };
  }

  /**
   * List all webhooks for a user
   */
  @Get()
  @ApiOperation({ summary: 'List all webhooks' })
  async listWebhooks(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId is required' };
    }

    const webhooks = await this.webhookService.listWebhooks(userId);

    return {
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.is_active,
        createdAt: w.created_at,
      })),
      count: webhooks.length,
    };
  }

  /**
   * Get webhook details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get webhook details' })
  async getWebhook(@Param('id') id: string) {
    const webhook = await this.webhookService.getWebhook(id);

    if (!webhook) {
      return { error: 'Webhook not found' };
    }

    const stats = await this.webhookService.getWebhookStats(id);

    return {
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.is_active,
        createdAt: webhook.created_at,
        recentDeliveries: webhook.deliveries,
      },
      stats,
    };
  }

  /**
   * Update webhook
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update webhook configuration' })
  async updateWebhook(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    await this.webhookService.updateWebhook(id, dto);

    return {
      message: 'Webhook updated successfully',
    };
  }

  /**
   * Delete webhook
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  async deleteWebhook(@Param('id') id: string) {
    await this.webhookService.deleteWebhook(id);

    return {
      message: 'Webhook deleted successfully',
    };
  }

  /**
   * Get webhook deliveries
   */
  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  async getDeliveries(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const deliveries = await this.webhookService.getDeliveries(
      id,
      limit ? parseInt(limit.toString()) : 50,
    );

    return {
      deliveries: deliveries.map((d) => ({
        id: d.id,
        eventType: d.event_type,
        status: d.status,
        attempts: d.attempts,
        error: d.error,
        deliveredAt: d.delivered_at,
        createdAt: d.created_at,
      })),
      count: deliveries.length,
    };
  }

  /**
   * Retry failed webhook delivery
   */
  @Post('deliveries/:deliveryId/retry')
  @ApiOperation({ summary: 'Retry failed webhook delivery' })
  async retryDelivery(@Param('deliveryId') deliveryId: string) {
    await this.webhookService.retryDelivery(deliveryId);

    // Queue for immediate processing
    await this.webhookQueue.add('deliver-webhook', { deliveryId });

    return {
      message: 'Webhook delivery retry queued',
    };
  }

  /**
   * Test webhook endpoint (trigger a test event)
   */
  @Post(':id/test')
  @ApiOperation({ summary: 'Send test webhook' })
  async testWebhook(@Param('id') id: string) {
    const webhook = await this.webhookService.getWebhook(id);

    if (!webhook) {
      return { error: 'Webhook not found' };
    }

    // Trigger a test event
    await this.webhookService.triggerWebhook({
      type: 'webhook.test',
      data: {
        message: 'This is a test webhook',
        webhookId: id,
      },
      timestamp: new Date(),
    });

    return {
      message: 'Test webhook triggered',
    };
  }

  /**
   * Manually trigger webhook for an event (for testing)
   */
  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger webhook event' })
  async triggerWebhook(@Body() dto: TriggerWebhookDto) {
    await this.webhookService.triggerWebhook({
      type: dto.eventType,
      data: dto.data,
      timestamp: new Date(),
    });

    return {
      message: 'Webhook event triggered',
      eventType: dto.eventType,
    };
  }

  /**
   * Get webhook statistics
   */
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  async getStats(@Param('id') id: string) {
    const stats = await this.webhookService.getWebhookStats(id);

    return stats;
  }
}
