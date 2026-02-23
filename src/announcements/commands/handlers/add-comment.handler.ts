import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddCommentCommand } from '../impl/add-comment.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(AddCommentCommand)
export class AddCommentHandler implements ICommandHandler<AddCommentCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: AddCommentCommand) {
    const { announcementId, userId, comment } = command;

    // Validate announcement exists
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Create comment
    const announcementComment = await this.prisma.announcement_comments.create({
      data: {
        announcement_id: announcementId,
        user_id: userId,
        comment,
      },
    });

    // Log audit
    await this.audit_logs.log({
      userId,
      action: 'announcement.commented',
      resourceType: 'announcement',
      resourceId: announcementId,
    });

    // TODO: Send notification to announcement author

    return announcementComment;
  }
}
