import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateMeetingCommand } from '../impl/create-meeting.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(CreateMeetingCommand)
export class CreateMeetingHandler implements ICommandHandler<CreateMeetingCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: CreateMeetingCommand) {
    const { buildingId, organizerId, title, description, scheduledAt, location, attendeeIds } =
      command;

    // Validate building exists
    const building = await this.prisma.buildings.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    // Create meeting
    const meeting = await this.prisma.meetings.create({
      data: {
        building_id: buildingId,
        created_by: organizerId,
        title,
        description,
        meeting_date: scheduledAt,
        location,
        status: 'scheduled',
        attendees: {
          create: attendeeIds.map((user_id) => ({
            user_id,
            rsvp_status: 'pending',
          })),
        },
      },
      include: {
        attendees: true,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: organizerId,
      action: 'meeting.created',
      resourceType: 'meeting',
      resourceId: meeting.id,
    });

    // TODO: Send meeting invitations to all attendees via notification service

    return meeting;
  }
}
