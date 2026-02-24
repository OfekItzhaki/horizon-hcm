export class UpdateApartmentCommand {
  constructor(
    public readonly apartmentId: string,
    public readonly areaSqm?: number,
    public readonly floor?: number,
    public readonly isVacant?: boolean,
  ) {}
}
