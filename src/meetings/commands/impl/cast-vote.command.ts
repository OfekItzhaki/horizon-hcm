export class CastVoteCommand {
  constructor(
    public readonly voteId: string,
    public readonly userId: string,
    public readonly selectedOption: string,
  ) {}
}
