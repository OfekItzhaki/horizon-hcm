export class SendMessageCommand {
  constructor(
    public readonly buildingId: string,
    public readonly senderId: string,
    public readonly recipientId: string,
    public readonly content: string,
  ) {}
}
