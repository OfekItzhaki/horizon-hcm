export class GetMessagesQuery {
  constructor(
    public readonly buildingId: string,
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 50,
  ) {}
}
