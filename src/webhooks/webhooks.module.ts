import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookProcessor } from './processors/webhook.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'webhooks',
    }),
  ],
  controllers: [WebhooksController],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhooksModule {}
