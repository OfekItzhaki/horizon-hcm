export class AssignMaintenanceRequestCommand {
  constructor(
    public readonly requestId: string,
    public readonly assignedTo: string,
  ) {}
}
