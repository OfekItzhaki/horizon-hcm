export class CreateApartmentCommand {
  constructor(
    public readonly buildingId: string,
    public readonly apartmentNumber: string,
    public readonly areaSqm?: number,
    public readonly floor?: number,
  ) {}
}
