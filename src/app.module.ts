import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import { HorizonAuthModule } from '@ofeklabs/horizon-auth';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { CommonModule } from './common/common.module';
import { BuildingsModule } from './buildings/buildings.module';
import { ApartmentsModule } from './apartments/apartments.module';
import { PaymentsModule } from './payments/payments.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MeetingsModule } from './meetings/meetings.module';
import { DocumentsModule } from './documents/documents.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ResidentsModule } from './residents/residents.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { SyncModule } from './sync/sync.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { ApiVersioningMiddleware } from './common/middleware/api-versioning.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // i18n configuration
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
    // Import PrismaModule first so it's available for HorizonAuthModule
    PrismaModule,
    // BullMQ configuration
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get<string>('REDIS_PORT') || '6379'),
        },
      }),
      inject: [ConfigService],
    }),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    // HorizonAuthModule with explicit database configuration
    HorizonAuthModule.forRoot({
      database: {
        url: process.env.DATABASE_URL,
      },
    }),
    LoggerModule,
    CommonModule,
    BuildingsModule,
    ApartmentsModule,
    PaymentsModule,
    MaintenanceModule,
    MeetingsModule,
    DocumentsModule,
    AnnouncementsModule,
    ResidentsModule,
    ReportsModule,
    NotificationsModule,
    FilesModule,
    SyncModule,
    RealtimeModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, ApiVersioningMiddleware).forRoutes('*');
  }
}
