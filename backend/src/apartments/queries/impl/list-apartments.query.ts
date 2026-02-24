export class ListApartmentsQuery {
  constructor(
    public readonly buildingId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly isVacant?: boolean,
  ) {}
}
