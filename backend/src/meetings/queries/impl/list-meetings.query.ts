export class ListMeetingsQuery {
  constructor(
    public readonly buildingId: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
