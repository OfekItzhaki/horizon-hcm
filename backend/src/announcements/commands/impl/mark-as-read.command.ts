export class MarkAsReadCommand {
  constructor(
    public readonly announcementId: string,
    public readonly userId: string,
  ) {}
}
