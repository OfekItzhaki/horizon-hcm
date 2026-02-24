export class UpdateMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: string,
    public readonly content?: string,
  ) {}
}
