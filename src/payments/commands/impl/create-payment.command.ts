export class CreatePaymentCommand {
  constructor(
    public readonly apartmentId: string,
    public readonly amount: number,
    public readonly dueDate: Date,
    public readonly paymentType: string,
    public readonly createdBy: string,
    public readonly description?: string,
    public readonly referenceNumber?: string,
  ) {}
}
