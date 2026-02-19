export class ListMaintenanceRequestsQuery {
  constructor(
    public readonly buildingId?: string,
    public readonly apartmentId?: string,
    public readonly status?: string,
    public readonly category?: string,
    public readonly priority?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
