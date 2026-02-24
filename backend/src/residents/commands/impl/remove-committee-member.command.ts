export class RemoveCommitteeMemberCommand {
  constructor(
    public readonly buildingId: string,
    public readonly memberId: string,
    public readonly currentUserId: string,
  ) {}
}
