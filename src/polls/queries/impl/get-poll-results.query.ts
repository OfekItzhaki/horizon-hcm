export class GetPollResultsQuery {
  constructor(
    public readonly pollId: string,
    public readonly buildingId: string,
  ) {}
}
