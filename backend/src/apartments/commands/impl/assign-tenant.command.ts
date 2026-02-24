export class AssignTenantCommand {
  constructor(
    public readonly apartmentId: string,
    public readonly userId: string,
    public readonly moveInDate?: Date,
  ) {}
}
