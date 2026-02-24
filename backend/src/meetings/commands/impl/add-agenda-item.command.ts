export class AddAgendaItemCommand {
  constructor(
    public readonly meetingId: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly order: number,
  ) {}
}
