import { ReportType, ExportFormat } from '../../dto/export-report.dto';

export class ExportFinancialReportQuery {
  constructor(
    public readonly buildingId: string,
    public readonly reportType: ReportType,
    public readonly format: ExportFormat,
    public readonly userId: string,
    public readonly userLocale: string,
    public readonly startDate?: string,
    public readonly endDate?: string,
  ) {}
}
