export class UpdateInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly userId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly amount?: number,
    public readonly dueDate?: Date,
  ) {}
}
