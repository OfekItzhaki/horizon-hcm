export class DeleteMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: string,
  ) {}
}
