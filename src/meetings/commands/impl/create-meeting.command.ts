export class CreateMeetingCommand {
  constructor(
    public readonly buildingId: string,
    public readonly organizerId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly scheduledAt: Date,
    public readonly location: string,
    public readonly attendeeIds: string[],
  ) {}
}
