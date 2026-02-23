import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddAgendaItemCommand } from '../impl/add-agenda-item.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(AddAgendaItemCommand)
export class AddAgendaItemHandler implements ICommandHandler<AddAgendaItemCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: AddAgendaItemCommand) {
    const { meetingId, title, description, order } = command;

    // Validate meeting exists
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Create agenda item
    const agendaItem = await this.prisma.agenda_items.create({
      data: {
        meeting_id: meetingId,
        title,
        description,
        order,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: meeting.created_by,
      action: 'agenda_item.created',
      resourceType: 'agenda_item',
      resourceId: agendaItem.id,
    });

    return agendaItem;
  }
}
