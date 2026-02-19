import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationService } from './services/notification.service';
import { TemplateService } from './services/template.service';
import { NotificationProcessor } from './processors/notification.processor';
import { FcmProvider } from './providers/fcm.provider';
import { ApnsProvider } from './providers/apns.provider';
import { WebPushProvider } from './providers/web-push.provider';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

// Command Handlers
import { CreateTemplateHandler } from './commands/handlers/create-template.handler';
import { UpdatePreferencesHandler } from './commands/handlers/update-preferences.handler';

// Query Handlers
import { GetTemplateHandler } from './queries/handlers/get-template.handler';
import { GetPreferencesHandler } from './queries/handlers/get-preferences.handler';

const CommandHandlers = [CreateTemplateHandler, UpdatePreferencesHandler];
const QueryHandlers = [GetTemplateHandler, GetPreferencesHandler];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    TemplateService,
    NotificationProcessor,
    FcmProvider,
    ApnsProvider,
    WebPushProvider,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [NotificationService, TemplateService],
})
export class NotificationsModule {}
