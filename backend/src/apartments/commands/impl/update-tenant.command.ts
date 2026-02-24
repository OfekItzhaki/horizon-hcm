export class UpdateTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly moveOutDate?: Date,
    public readonly isActive?: boolean,
  ) {}
}
