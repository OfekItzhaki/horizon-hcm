export class MarkMessageReadCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: string,
  ) {}
}
