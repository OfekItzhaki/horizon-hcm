export class ListDocumentsQuery {
  constructor(
    public readonly buildingId: string,
    public readonly category?: string,
    public readonly accessLevel?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
