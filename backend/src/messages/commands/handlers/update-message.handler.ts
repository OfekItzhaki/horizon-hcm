import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateMessageCommand } from '../impl/update-message.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdateMessageCommand)
export class UpdateMessageHandler implements ICommandHandler<UpdateMessageCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: UpdateMessageCommand) {
    const { messageId, userId, content } = command;

    // Find message
    const message = await this.prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can update message
    if (message.sender_id !== userId) {
      throw new ForbiddenException('You can only update your own messages');
    }

    // Update message
    const updatedMessage = await this.prisma.messages.update({
      where: { id: messageId },
      data: {
        content: content ?? message.content,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'message.updated',
      resourceType: 'message',
      resourceId: messageId,
    });

    return updatedMessage;
  }
}
