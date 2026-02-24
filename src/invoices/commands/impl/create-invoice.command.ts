export class CreateInvoiceCommand {
  constructor(
    public readonly buildingId: string,
    public readonly apartmentId: string | undefined,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly amount: number,
    public readonly dueDate: Date,
    public readonly createdBy: string,
  ) {}
}
