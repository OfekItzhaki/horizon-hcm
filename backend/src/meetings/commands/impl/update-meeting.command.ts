export class UpdateMeetingCommand {
  constructor(
    public readonly meetingId: string,
    public readonly updates: {
      title?: string;
      description?: string;
      scheduledAt?: Date;
      location?: string;
    },
  ) {}
}
