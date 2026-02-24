import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReportsController } from './reports.controller';

// Query Handlers
import { GetBuildingBalanceHandler } from './queries/handlers/get-building-balance.handler';
import { GetTransactionHistoryHandler } from './queries/handlers/get-transaction-history.handler';
import { GetIncomeReportHandler } from './queries/handlers/get-income-report.handler';
import { GetExpenseReportHandler } from './queries/handlers/get-expense-report.handler';
import { GetBudgetComparisonHandler } from './queries/handlers/get-budget-comparison.handler';
import { GetPaymentStatusSummaryHandler } from './queries/handlers/get-payment-status-summary.handler';
import { GetYearOverYearHandler } from './queries/handlers/get-year-over-year.handler';
import { ExportFinancialReportHandler } from './queries/handlers/export-financial-report.handler';

// Services
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { StorageService } from '../files/services/storage.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { FormattingService } from '../common/services/formatting.service';
import { LoggerService } from '../common/logger/logger.service';

const QueryHandlers = [
  GetBuildingBalanceHandler,
  GetTransactionHistoryHandler,
  GetIncomeReportHandler,
  GetExpenseReportHandler,
  GetBudgetComparisonHandler,
  GetPaymentStatusSummaryHandler,
  GetYearOverYearHandler,
  ExportFinancialReportHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ReportsController],
  providers: [
    ...QueryHandlers,
    PrismaService,
    CacheService,
    StorageService,
    AuditLogService,
    FormattingService,
    LoggerService,
  ],
})
export class ReportsModule {}
