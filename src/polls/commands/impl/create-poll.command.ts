export class CreatePollCommand {
  constructor(
    public readonly buildingId: string,
    public readonly createdBy: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly options: string[],
    public readonly allowMultiple: boolean,
    public readonly isAnonymous: boolean,
    public readonly endDate: Date,
  ) {}
}
