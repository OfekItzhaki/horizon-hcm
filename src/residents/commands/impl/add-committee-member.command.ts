export class AddCommitteeMemberCommand {
  constructor(
    public readonly buildingId: string,
    public readonly userId: string,
    public readonly role: string,
    public readonly currentUserId: string,
  ) {}
}
