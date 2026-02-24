export class AssignOwnerCommand {
  constructor(
    public readonly apartmentId: string,
    public readonly userId: string,
    public readonly ownershipShare?: number,
    public readonly isPrimary?: boolean,
  ) {}
}
