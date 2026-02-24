export class GetExpenseReportQuery {
  constructor(
    public readonly buildingId: string,
    public readonly startDate?: string,
    public readonly endDate?: string,
  ) {}
}
