import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPreferencesQuery } from '../impl/get-preferences.query';

@Injectable()
@QueryHandler(GetPreferencesQuery)
export class GetPreferencesHandler
  implements IQueryHandler<GetPreferencesQuery>
{
  constructor(private prisma: PrismaService) {}

  async execute(query: GetPreferencesQuery) {
    const { userId } = query;

    // Get preferences or return defaults
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { user_id: userId },
    });

    // If no preferences exist, return defaults
    if (!preferences) {
      preferences = {
        id: '',
        user_id: userId,
        payment_reminders: true,
        maintenance_alerts: true,
        meeting_notifications: true,
        general_announcements: true,
        push_enabled: true,
        email_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
    }

    return preferences;
  }
}
