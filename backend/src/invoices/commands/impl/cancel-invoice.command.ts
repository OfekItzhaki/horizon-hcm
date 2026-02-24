export class CancelInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {}
}
