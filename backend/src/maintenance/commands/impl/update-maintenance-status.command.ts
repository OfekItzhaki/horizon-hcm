export class UpdateMaintenanceStatusCommand {
  constructor(
    public readonly requestId: string,
    public readonly status: string,
  ) {}
}
