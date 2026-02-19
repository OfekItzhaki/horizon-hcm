export class CreateMaintenanceRequestCommand {
  constructor(
    public readonly buildingId: string,
    public readonly requesterId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly priority: string,
    public readonly apartmentId?: string,
  ) {}
}
