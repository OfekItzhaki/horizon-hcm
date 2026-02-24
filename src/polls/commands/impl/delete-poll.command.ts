export class DeletePollCommand {
  constructor(
    public readonly pollId: string,
    public readonly userId: string,
  ) {}
}
