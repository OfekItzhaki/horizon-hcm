export class AddMaintenanceCommentCommand {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly comment: string,
  ) {}
}
