export class CreateBuildingCommand {
  constructor(
    public readonly name: string,
    public readonly addressLine: string,
    public readonly city?: string,
    public readonly postalCode?: string,
    public readonly numUnits?: number,
  ) {}
}
