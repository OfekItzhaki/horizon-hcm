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

// Services
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';

const QueryHandlers = [
  GetBuildingBalanceHandler,
  GetTransactionHistoryHandler,
  GetIncomeReportHandler,
  GetExpenseReportHandler,
  GetBudgetComparisonHandler,
  GetPaymentStatusSummaryHandler,
  GetYearOverYearHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ReportsController],
  providers: [...QueryHandlers, PrismaService, CacheService],
})
export class ReportsModule {}
