import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RsvpMeetingCommand } from '../impl/rsvp-meeting.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(RsvpMeetingCommand)
export class RsvpMeetingHandler implements ICommandHandler<RsvpMeetingCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: RsvpMeetingCommand) {
    const { meetingId, userId, status } = command;

    // Validate meeting exists
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Update or create attendee RSVP
    const attendee = await this.prisma.meetingAttendee.upsert({
      where: {
        meeting_id_user_id: {
          meeting_id: meetingId,
          user_id: userId,
        },
      },
      update: {
        rsvp_status: status,
      },
      create: {
        meeting_id: meetingId,
        user_id: userId,
        rsvp_status: status,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'meeting.rsvp',
      resourceType: 'meeting',
      resourceId: meetingId,
    });

    return attendee;
  }
}
