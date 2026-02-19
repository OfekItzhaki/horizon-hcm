export class AddMaintenancePhotoCommand {
  constructor(
    public readonly requestId: string,
    public readonly fileId: string,
  ) {}
}
