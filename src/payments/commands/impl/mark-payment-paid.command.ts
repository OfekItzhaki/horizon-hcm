export class MarkPaymentPaidCommand {
  constructor(
    public readonly paymentId: string,
    public readonly paidDate: Date,
  ) {}
}
