export class DeleteAnnouncementCommand {
  constructor(
    public readonly announcementId: string,
    public readonly userId: string,
  ) {}
}
