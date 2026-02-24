import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportType {
  BALANCE = 'balance',
  TRANSACTIONS = 'transactions',
  INCOME = 'income',
  EXPENSES = 'expenses',
  BUDGET = 'budget',
  PAYMENT_STATUS = 'payment-status',
  YEAR_OVER_YEAR = 'yoy',
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

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
