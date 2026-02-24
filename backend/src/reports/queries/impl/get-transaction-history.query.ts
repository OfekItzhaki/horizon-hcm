export class GetTransactionHistoryQuery {
  constructor(
    public readonly buildingId: string,
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly transactionType?: string,
  ) {}
}
