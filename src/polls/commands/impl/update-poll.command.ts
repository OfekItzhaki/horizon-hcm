export class UpdatePollCommand {
  constructor(
    public readonly pollId: string,
    public readonly userId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly options?: string[],
    public readonly endDate?: Date,
  ) {}
}
