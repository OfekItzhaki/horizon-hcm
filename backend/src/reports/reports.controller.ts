import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard } from '@ofeklabs/horizon-auth';
import { BuildingMemberGuard } from '../common/guards/building-member.guard';
import { CommitteeMemberGuard } from '../common/guards/committee-member.guard';
import { DateRangeDto } from './dto/date-range.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { BudgetComparisonDto } from './dto/budget-comparison.dto';
import { GetBuildingBalanceQuery } from './queries/impl/get-building-balance.query';
import { GetTransactionHistoryQuery } from './queries/impl/get-transaction-history.query';
import { GetIncomeReportQuery } from './queries/impl/get-income-report.query';
import { GetExpenseReportQuery } from './queries/impl/get-expense-report.query';
import { GetBudgetComparisonQuery } from './queries/impl/get-budget-comparison.query';
import { GetPaymentStatusSummaryQuery } from './queries/impl/get-payment-status-summary.query';
import { GetYearOverYearQuery } from './queries/impl/get-year-over-year.query';
import { ExportFinancialReportQuery } from './queries/impl/export-financial-report.query';
import { ExportReportDto } from './dto/export-report.dto';

@ApiTags('Reports')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('buildings/:buildingId/reports/balance')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get building balance' })
  @ApiResponse({
    status: 200,
    description: 'Building balance retrieved',
  })
  async getBalance(@CurrentUser() user: any, @Param('buildingId') buildingId: string) {
    return this.queryBus.execute(new GetBuildingBalanceQuery(buildingId));
  }

  @Get('buildings/:buildingId/reports/transactions')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'transactionType', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved',
  })
  async getTransactions(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query() filters: TransactionFiltersDto,
  ) {
    return this.queryBus.execute(
      new GetTransactionHistoryQuery(
        buildingId,
        filters.page || 1,
        filters.limit || 50,
        filters.startDate,
        filters.endDate,
        filters.transactionType,
      ),
    );
  }

  @Get('buildings/:buildingId/reports/income')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get income report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Income report retrieved',
  })
  async getIncome(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.queryBus.execute(
      new GetIncomeReportQuery(
        buildingId,
        dateRange.startDate,
        dateRange.endDate,
      ),
    );
  }

  @Get('buildings/:buildingId/reports/expenses')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get expense report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Expense report retrieved',
  })
  async getExpenses(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.queryBus.execute(
      new GetExpenseReportQuery(
        buildingId,
        dateRange.startDate,
        dateRange.endDate,
      ),
    );
  }

  @Get('buildings/:buildingId/reports/budget-comparison')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get budget comparison' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Budget comparison retrieved',
  })
  async getBudgetComparison(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query() dto: BudgetComparisonDto,
  ) {
    return this.queryBus.execute(
      new GetBudgetComparisonQuery(buildingId, dto.startDate, dto.endDate),
    );
  }

  @Get('buildings/:buildingId/reports/payment-status')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment status summary' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment status summary retrieved',
  })
  async getPaymentStatus(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.queryBus.execute(
      new GetPaymentStatusSummaryQuery(
        buildingId,
        dateRange.startDate,
        dateRange.endDate,
      ),
    );
  }

  @Get('buildings/:buildingId/reports/year-over-year')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get year-over-year comparison' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Year-over-year comparison retrieved',
  })
  async getYearOverYear(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query('year') year?: number,
  ) {
    return this.queryBus.execute(new GetYearOverYearQuery(buildingId, year));
  }

  @Get('buildings/:buildingId/reports/export')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export financial report' })
  @ApiQuery({ name: 'reportType', required: true, enum: ['balance', 'transactions', 'income', 'expenses', 'budget', 'payment-status', 'yoy'] })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'pdf'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
  })
  async exportReport(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query() dto: ExportReportDto,
  ) {
    return this.queryBus.execute(
      new ExportFinancialReportQuery(
        buildingId,
        dto.reportType,
        dto.format,
        user.id,
        user.preferredLanguage || 'he-IL',
        dto.startDate,
        dto.endDate,
      ),
    );
  }
}
