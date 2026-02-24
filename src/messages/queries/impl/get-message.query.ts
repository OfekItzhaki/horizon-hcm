export class GetMessageQuery {
  constructor(
    public readonly messageId: string,
    public readonly buildingId: string,
  ) {}
}
