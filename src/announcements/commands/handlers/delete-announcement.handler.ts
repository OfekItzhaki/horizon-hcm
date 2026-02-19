import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteAnnouncementCommand } from '../impl/delete-announcement.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(DeleteAnnouncementCommand)
export class DeleteAnnouncementHandler implements ICommandHandler<DeleteAnnouncementCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: DeleteAnnouncementCommand) {
    const { announcementId, userId } = command;

    // Validate announcement exists
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Soft delete announcement
    await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        deleted_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'announcement.deleted',
      resourceType: 'announcement',
      resourceId: announcementId,
    });

    return { success: true };
  }
}
