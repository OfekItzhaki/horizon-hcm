export class SearchResidentsQuery {
  constructor(
    public readonly buildingId: string,
    public readonly searchTerm: string,
    public readonly searchField: string = 'name',
  ) {}
}
