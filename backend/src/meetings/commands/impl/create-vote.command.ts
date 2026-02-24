export class CreateVoteCommand {
  constructor(
    public readonly meetingId: string,
    public readonly question: string,
    public readonly options: string[],
  ) {}
}
