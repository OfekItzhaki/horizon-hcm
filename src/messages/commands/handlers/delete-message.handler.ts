import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteMessageCommand } from '../impl/delete-message.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(DeleteMessageCommand)
export class DeleteMessageHandler implements ICommandHandler<DeleteMessageCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: DeleteMessageCommand) {
    const { messageId, userId } = command;

    // Find message
    const message = await this.prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete message
    if (message.sender_id !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Soft delete message
    await this.prisma.messages.update({
      where: { id: messageId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'message.deleted',
      resourceType: 'message',
      resourceId: messageId,
    });

    return { success: true, message: 'Message deleted successfully' };
  }
}
