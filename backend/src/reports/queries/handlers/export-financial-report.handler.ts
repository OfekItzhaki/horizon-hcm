import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../files/services/storage.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { FormattingService } from '../../../common/services/formatting.service';
import { ExportFinancialReportQuery } from '../impl/export-financial-report.query';
import { ReportType, ExportFormat } from '../../dto/export-report.dto';
import { GetBuildingBalanceQuery } from '../impl/get-building-balance.query';
import { GetTransactionHistoryQuery } from '../impl/get-transaction-history.query';
import { GetIncomeReportQuery } from '../impl/get-income-report.query';
import { GetExpenseReportQuery } from '../impl/get-expense-report.query';
import { GetBudgetComparisonQuery } from '../impl/get-budget-comparison.query';
import { GetPaymentStatusSummaryQuery } from '../impl/get-payment-status-summary.query';
import { GetYearOverYearQuery } from '../impl/get-year-over-year.query';

@Injectable()
@QueryHandler(ExportFinancialReportQuery)
export class ExportFinancialReportHandler
  implements IQueryHandler<ExportFinancialReportQuery>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
    private readonly storageService: StorageService,
    private readonly auditLogService: AuditLogService,
    private readonly formattingService: FormattingService,
  ) {}

  async execute(query: ExportFinancialReportQuery): Promise<{ downloadUrl: string }> {
    // Get building info
    const building = await this.prisma.buildings.findUnique({
      where: { id: query.buildingId },
      select: { name: true },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    // Fetch report data based on type
    const reportData = await this.fetchReportData(query);

    // Generate file based on format
    let fileBuffer: Buffer;
    let filename: string;
    let mimetype: string;

    if (query.format === ExportFormat.CSV) {
      fileBuffer = this.generateCSV(query.reportType, reportData, building.name, query);
      filename = `${query.reportType}-report-${Date.now()}.csv`;
      mimetype = 'text/csv';
    } else {
      fileBuffer = this.generatePDF(query.reportType, reportData, building.name, query);
      filename = `${query.reportType}-report-${Date.now()}.pdf`;
      mimetype = 'application/pdf';
    }

    // Upload to storage with 24-hour expiration
    const uploadResult = await this.storageService.upload(
      {
        buffer: fileBuffer,
        originalname: filename,
        mimetype,
      } as Express.Multer.File,
      query.userId,
      false,
    );

    // Generate signed URL with 24-hour expiration
    const downloadUrl = await this.storageService.getSignedUrl(
      uploadResult.storageKey,
      86400, // 24 hours in seconds
    );

    // Log export in audit log
    await this.auditLogService.log({
      userId: query.userId,
      action: 'EXPORT_FINANCIAL_REPORT',
      resourceType: 'Report',
      resourceId: query.buildingId,
      metadata: {
        reportType: query.reportType,
        format: query.format,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      ipAddress: null,
      userAgent: null,
    });

    return { downloadUrl };
  }

  private async fetchReportData(query: ExportFinancialReportQuery): Promise<any> {
    switch (query.reportType) {
      case ReportType.BALANCE:
        return this.queryBus.execute(new GetBuildingBalanceQuery(query.buildingId));

      case ReportType.TRANSACTIONS:
        return this.queryBus.execute(
          new GetTransactionHistoryQuery(
            query.buildingId,
            1,
            1000, // Get all transactions for export
            query.startDate,
            query.endDate,
          ),
        );

      case ReportType.INCOME:
        return this.queryBus.execute(
          new GetIncomeReportQuery(query.buildingId, query.startDate, query.endDate),
        );

      case ReportType.EXPENSES:
        return this.queryBus.execute(
          new GetExpenseReportQuery(query.buildingId, query.startDate, query.endDate),
        );

      case ReportType.BUDGET:
        return this.queryBus.execute(
          new GetBudgetComparisonQuery(query.buildingId, query.startDate, query.endDate),
        );

      case ReportType.PAYMENT_STATUS:
        return this.queryBus.execute(
          new GetPaymentStatusSummaryQuery(
            query.buildingId,
            query.startDate,
            query.endDate,
          ),
        );

      case ReportType.YEAR_OVER_YEAR:
        const year = query.startDate ? new Date(query.startDate).getFullYear() : undefined;
        return this.queryBus.execute(new GetYearOverYearQuery(query.buildingId, year));

      default:
        throw new Error(`Unsupported report type: ${query.reportType}`);
    }
  }

  private generateCSV(
    reportType: ReportType,
    data: any,
    buildingName: string,
    query: ExportFinancialReportQuery,
  ): Buffer {
    const timestamp = this.formattingService.formatDateTime(
      new Date(),
      query.userLocale,
    );
    const dateRange = query.startDate && query.endDate
      ? `${this.formattingService.formatDate(new Date(query.startDate), query.userLocale)} - ${this.formattingService.formatDate(new Date(query.endDate), query.userLocale)}`
      : '';

    let csv = `"${reportType.toUpperCase()} REPORT"\n`;
    csv += `"Building: ${this.escapeCSV(buildingName)}"\n`;
    if (dateRange) {
      csv += `"Period: ${dateRange}"\n`;
    }
    csv += `"Generated: ${timestamp}"\n\n`;

    switch (reportType) {
      case ReportType.BALANCE:
        csv += this.generateBalanceCSV(data, query.userLocale);
        break;
      case ReportType.TRANSACTIONS:
        csv += this.generateTransactionsCSV(data, query.userLocale);
        break;
      case ReportType.INCOME:
        csv += this.generateIncomeCSV(data, query.userLocale);
        break;
      case ReportType.EXPENSES:
        csv += this.generateExpensesCSV(data, query.userLocale);
        break;
      case ReportType.BUDGET:
        csv += this.generateBudgetCSV(data, query.userLocale);
        break;
      case ReportType.PAYMENT_STATUS:
        csv += this.generatePaymentStatusCSV(data, query.userLocale);
        break;
      case ReportType.YEAR_OVER_YEAR:
        csv += this.generateYoYCSV(data, query.userLocale);
        break;
    }

    return Buffer.from(csv, 'utf-8');
  }

  private generateBalanceCSV(data: any, locale: string): string {
    let csv = '"Metric","Amount"\n';
    csv += `"Total Income","${this.formatAmount(data.totalIncome, locale)}"\n`;
    csv += `"Total Expenses","${this.formatAmount(data.totalExpenses, locale)}"\n`;
    csv += `"Current Balance","${this.formatAmount(data.balance, locale)}"\n`;
    return csv;
  }

  private generateTransactionsCSV(data: any, locale: string): string {
    let csv = '"Date","Apartment","Type","Amount","Status"\n';
    for (const tx of data.transactions || []) {
      csv += `"${this.formattingService.formatDate(new Date(tx.date), locale)}",`;
      csv += `"${this.escapeCSV(tx.apartmentNumber || 'N/A')}",`;
      csv += `"${this.escapeCSV(tx.type)}",`;
      csv += `"${this.formatAmount(tx.amount, locale)}",`;
      csv += `"${this.escapeCSV(tx.status)}"\n`;
    }
    return csv;
  }

  private generateIncomeCSV(data: any, locale: string): string {
    let csv = '"Category","Count","Total Amount"\n';
    for (const category of data.categories || []) {
      csv += `"${this.escapeCSV(category.type)}",`;
      csv += `"${category.count}",`;
      csv += `"${this.formatAmount(category.total, locale)}"\n`;
    }
    csv += `\n"Grand Total","${data.totalCount}","${this.formatAmount(data.grandTotal, locale)}"\n`;
    return csv;
  }

  private generateExpensesCSV(data: any, locale: string): string {
    let csv = '"Category","Count","Total Amount"\n';
    for (const category of data.categories || []) {
      csv += `"${this.escapeCSV(category.category)}",`;
      csv += `"${category.count}",`;
      csv += `"${this.formatAmount(category.total, locale)}"\n`;
    }
    csv += `\n"Grand Total","${data.totalCount}","${this.formatAmount(data.grandTotal, locale)}"\n`;
    return csv;
  }

  private generateBudgetCSV(data: any, locale: string): string {
    let csv = '"Category","Budgeted","Actual","Variance","Variance %","Status"\n';
    
    // Income
    csv += `"Income","${this.formatAmount(data.income.budgeted, locale)}",`;
    csv += `"${this.formatAmount(data.income.actual, locale)}",`;
    csv += `"${this.formatAmount(data.income.variance, locale)}",`;
    csv += `"${data.income.variancePercentage?.toFixed(2) || 'N/A'}%",`;
    csv += `"${data.income.status}"\n`;

    // Expenses
    csv += `"Expenses","${this.formatAmount(data.expenses.budgeted, locale)}",`;
    csv += `"${this.formatAmount(data.expenses.actual, locale)}",`;
    csv += `"${this.formatAmount(data.expenses.variance, locale)}",`;
    csv += `"${data.expenses.variancePercentage?.toFixed(2) || 'N/A'}%",`;
    csv += `"${data.expenses.status}"\n`;

    return csv;
  }

  private generatePaymentStatusCSV(data: any, locale: string): string {
    let csv = '"Status","Count","Total Amount"\n';
    for (const status of data.statuses || []) {
      csv += `"${this.escapeCSV(status.status)}",`;
      csv += `"${status.count}",`;
      csv += `"${this.formatAmount(status.total, locale)}"\n`;
    }
    csv += `\n"Collection Rate","","${data.collectionRate?.toFixed(2) || '0.00'}%"\n`;
    return csv;
  }

  private generateYoYCSV(data: any, locale: string): string {
    let csv = '"Metric","Current Year","Previous Year","Change","Change %"\n';
    
    csv += `"Income","${this.formatAmount(data.currentYear.income, locale)}",`;
    csv += `"${this.formatAmount(data.previousYear.income, locale)}",`;
    csv += `"${this.formatAmount(data.change.income, locale)}",`;
    csv += `"${data.changePercentage.income?.toFixed(2) || '0.00'}%"\n`;

    csv += `"Expenses","${this.formatAmount(data.currentYear.expenses, locale)}",`;
    csv += `"${this.formatAmount(data.previousYear.expenses, locale)}",`;
    csv += `"${this.formatAmount(data.change.expenses, locale)}",`;
    csv += `"${data.changePercentage.expenses?.toFixed(2) || '0.00'}%"\n`;

    if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
      csv += '\n"Monthly Breakdown"\n';
      csv += '"Month","Income","Expenses"\n';
      for (const month of data.monthlyBreakdown) {
        csv += `"${month.month}",`;
        csv += `"${this.formatAmount(month.income, locale)}",`;
        csv += `"${this.formatAmount(month.expenses, locale)}"\n`;
      }
    }

    return csv;
  }

  private generatePDF(
    reportType: ReportType,
    data: any,
    buildingName: string,
    query: ExportFinancialReportQuery,
  ): Buffer {
    // For MVP, we'll generate a simple text-based PDF
    // In production, you'd use a library like pdfkit or puppeteer
    const timestamp = this.formattingService.formatDateTime(
      new Date(),
      query.userLocale,
    );
    const dateRange = query.startDate && query.endDate
      ? `${this.formattingService.formatDate(new Date(query.startDate), query.userLocale)} - ${this.formattingService.formatDate(new Date(query.endDate), query.userLocale)}`
      : '';

    let content = `${reportType.toUpperCase()} REPORT\n\n`;
    content += `Building: ${buildingName}\n`;
    if (dateRange) {
      content += `Period: ${dateRange}\n`;
    }
    content += `Generated: ${timestamp}\n\n`;
    content += '='.repeat(80) + '\n\n';

    // For now, convert CSV to text format
    // In production, use proper PDF generation library
    const csvContent = this.generateCSV(reportType, data, buildingName, query).toString();
    content += csvContent.replace(/"/g, '').replace(/,/g, ' | ');

    return Buffer.from(content, 'utf-8');
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    return value.replace(/"/g, '""');
  }

  private formatAmount(amount: number | null | undefined, locale: string): string {
    if (amount === null || amount === undefined) return 'N/A';
    return this.formattingService.formatCurrency(amount, 'ILS', locale);
  }
}
