export class UpdateBuildingCommand {
  constructor(
    public readonly buildingId: string,
    public readonly name?: string,
    public readonly addressLine?: string,
    public readonly city?: string,
    public readonly postalCode?: string,
    public readonly numUnits?: number,
    public readonly isActive?: boolean,
  ) {}
}
