import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdatePreferencesCommand } from '../impl/update-preferences.command';

@Injectable()
@CommandHandler(UpdatePreferencesCommand)
export class UpdatePreferencesHandler implements ICommandHandler<UpdatePreferencesCommand> {
  constructor(private prisma: PrismaService) {}

  async execute(command: UpdatePreferencesCommand) {
    const {
      userId,
      paymentReminders,
      maintenanceAlerts,
      meetingNotifications,
      generalAnnouncements,
      pushEnabled,
      emailEnabled,
    } = command;

    // Build update data object with only provided fields
    const updateData: any = {};
    if (paymentReminders !== undefined) updateData.payment_reminders = paymentReminders;
    if (maintenanceAlerts !== undefined) updateData.maintenance_alerts = maintenanceAlerts;
    if (meetingNotifications !== undefined) updateData.meeting_notifications = meetingNotifications;
    if (generalAnnouncements !== undefined) updateData.general_announcements = generalAnnouncements;
    if (pushEnabled !== undefined) updateData.push_enabled = pushEnabled;
    if (emailEnabled !== undefined) updateData.email_enabled = emailEnabled;

    // Upsert preferences (create if not exists, update if exists)
    const preferences = await this.prisma.notification_preferences.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...updateData,
      },
      update: updateData,
    });

    return preferences;
  }
}
