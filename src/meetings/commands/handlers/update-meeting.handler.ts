import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateMeetingCommand } from '../impl/update-meeting.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdateMeetingCommand)
export class UpdateMeetingHandler implements ICommandHandler<UpdateMeetingCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: UpdateMeetingCommand) {
    const { meetingId, updates } = command;

    // Validate meeting exists
    const meeting = await this.prisma.meetings.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Update meeting
    const updatedMeeting = await this.prisma.meetings.update({
      where: { id: meetingId },
      data: updates,
      include: {
        attendees: true,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: meeting.created_by,
      action: 'meeting.updated',
      resourceType: 'meeting',
      resourceId: meetingId,
    });

    // TODO: Send update notifications to all attendees

    return updatedMeeting;
  }
}
