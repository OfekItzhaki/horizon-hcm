import { Module, Global } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ETagService } from './services/etag.service';
import { PaginationService } from './services/pagination.service';
import { CacheService } from './services/cache.service';
import { RequestSigningService } from './services/request-signing.service';
import { DeviceFingerprintService } from './services/device-fingerprint.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { AuditLogService } from './services/audit-log.service';
import { GDPRService } from './services/gdpr.service';
import { PasswordPolicyService } from './services/password-policy.service';
import { AnalyticsService } from './services/analytics.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { FormattingService } from './services/formatting.service';
import { TranslationService } from './services/translation.service';
import { MonitoringService } from './services/monitoring.service';
import { DeploymentHealthMonitorService } from './services/deployment-health-monitor.service';
import { SecurityController } from './controllers/security.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { I18nController } from './controllers/i18n.controller';
import { AdminController } from './controllers/admin.controller';
import { ExportUserDataCommandHandler } from './commands/handlers/export-user-data.handler';
import { DeleteUserDataCommandHandler } from './commands/handlers/delete-user-data.handler';
import { PrismaModule } from '../prisma/prisma.module';

const CommandHandlers = [
  ExportUserDataCommandHandler,
  DeleteUserDataCommandHandler,
];

@Global()
@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SecurityController, AnalyticsController, I18nController, AdminController],
  providers: [
    ETagService,
    PaginationService,
    CacheService,
    RequestSigningService,
    DeviceFingerprintService,
    AnomalyDetectionService,
    AuditLogService,
    GDPRService,
    PasswordPolicyService,
    AnalyticsService,
    FeatureFlagService,
    FormattingService,
    TranslationService,
    MonitoringService,
    DeploymentHealthMonitorService,
    ...CommandHandlers,
  ],
  exports: [
    ETagService,
    PaginationService,
    CacheService,
    RequestSigningService,
    DeviceFingerprintService,
    AnomalyDetectionService,
    AuditLogService,
    GDPRService,
    PasswordPolicyService,
    AnalyticsService,
    FeatureFlagService,
    FormattingService,
    TranslationService,
    MonitoringService,
    DeploymentHealthMonitorService,
  ],
})
export class CommonModule {}
