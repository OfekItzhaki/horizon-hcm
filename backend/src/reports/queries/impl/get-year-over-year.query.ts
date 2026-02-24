export class GetYearOverYearQuery {
  constructor(
    public readonly buildingId: string,
    public readonly year?: number,
  ) {}
}
