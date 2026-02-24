export class GetPollQuery {
  constructor(
    public readonly pollId: string,
    public readonly buildingId: string,
  ) {}
}
