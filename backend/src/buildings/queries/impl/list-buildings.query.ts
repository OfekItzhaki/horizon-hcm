export class ListBuildingsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly search?: string,
  ) {}
}
