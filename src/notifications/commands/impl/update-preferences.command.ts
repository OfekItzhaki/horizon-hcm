export class UpdatePreferencesCommand {
  constructor(
    public readonly userId: string,
    public readonly paymentReminders?: boolean,
    public readonly maintenanceAlerts?: boolean,
    public readonly meetingNotifications?: boolean,
    public readonly generalAnnouncements?: boolean,
    public readonly pushEnabled?: boolean,
    public readonly emailEnabled?: boolean,
  ) {}
}
