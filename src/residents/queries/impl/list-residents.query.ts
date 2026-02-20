export class ListResidentsQuery {
  constructor(
    public readonly buildingId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly search?: string,
    public readonly userType?: string,
    public readonly apartmentNumber?: string,
    public readonly phoneNumber?: string,
  ) {}
}
