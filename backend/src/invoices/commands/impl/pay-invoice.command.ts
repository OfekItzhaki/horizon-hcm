export class PayInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly userId: string,
    public readonly method: string,
    public readonly amount: number,
  ) {}
}
