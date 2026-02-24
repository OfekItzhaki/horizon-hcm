export class AddCommentCommand {
  constructor(
    public readonly announcementId: string,
    public readonly userId: string,
    public readonly comment: string,
  ) {}
}
