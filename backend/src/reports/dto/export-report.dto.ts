import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Available report types for export.
 */
export enum ReportType {
  BALANCE = 'balance',
  TRANSACTIONS = 'transactions',
  INCOME = 'income',
  EXPENSES = 'expenses',
  BUDGET = 'budget',
  PAYMENT_STATUS = 'payment-status',
  YEAR_OVER_YEAR = 'yoy',
}

/**
 * Supported export formats.
 */
export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

/**
 * DTO for exporting financial reports in various formats.
 * 
 * Supports multiple report types and export formats with optional date filtering.
 * 
 * @example
 * ```typescript
 * const dto: ExportReportDto = {
 *   reportType: ReportType.TRANSACTIONS,
 *   format: ExportFormat.PDF,
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * };
 * ```
 */
export class ExportReportDto {
  @ApiProperty({
    enum: ReportType,
    description: 'Type of report to export',
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    enum: ExportFormat,
    description: 'Export format',
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    required: false,
    description: 'Start date for the report',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date for the report',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
