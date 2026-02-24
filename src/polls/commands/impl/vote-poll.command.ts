export class VotePollCommand {
  constructor(
    public readonly pollId: string,
    public readonly userId: string,
    public readonly optionIds: string[],
  ) {}
}
