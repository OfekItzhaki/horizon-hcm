export class RemoveOwnerCommand {
  constructor(
    public readonly apartmentId: string,
    public readonly ownerId: string,
  ) {}
}
