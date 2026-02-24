export class CreateAnnouncementCommand {
  constructor(
    public readonly buildingId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly category: string,
    public readonly isUrgent: boolean,
  ) {}
}
