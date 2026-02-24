export class ListAnnouncementsQuery {
  constructor(
    public readonly buildingId: string,
    public readonly category?: string,
    public readonly isUrgent?: boolean,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
