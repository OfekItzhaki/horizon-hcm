import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { generateId } from '../../../common/utils/id-generator';
import { CreateAnnouncementCommand } from '../impl/create-announcement.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(CreateAnnouncementCommand)
export class CreateAnnouncementHandler implements ICommandHandler<CreateAnnouncementCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: CreateAnnouncementCommand) {
    const { buildingId, authorId, title, content, category, isUrgent } = command;

    // Validate building exists
    const building = await this.prisma.buildings.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    // Create announcement
    const announcement = await this.prisma.announcements.create({
      data: {
        id: generateId(),
        building_id: buildingId,
        author_id: authorId,
        title,
        content,
        category,
        is_urgent: isUrgent,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: authorId,
      action: 'announcement.created',
      resourceType: 'announcement',
      resourceId: announcement.id,
    });

    // TODO: Send notifications to all residents in the building

    return announcement;
  }
}
