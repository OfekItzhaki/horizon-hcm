export class RsvpMeetingCommand {
  constructor(
    public readonly meetingId: string,
    public readonly userId: string,
    public readonly status: string,
  ) {}
}
