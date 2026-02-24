import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MarkMessageReadCommand } from '../impl/mark-message-read.command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(MarkMessageReadCommand)
export class MarkMessageReadHandler implements ICommandHandler<MarkMessageReadCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: MarkMessageReadCommand) {
    const { messageId, userId } = command;

    // Find message
    const message = await this.prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only recipient can mark message as read
    if (message.recipient_id !== userId) {
      throw new ForbiddenException('You can only mark your own messages as read');
    }

    // Mark as read
    const updatedMessage = await this.prisma.messages.update({
      where: { id: messageId },
      data: {
        is_read: true,
        read_at: new Date(),
        updated_at: new Date(),
      },
    });

    return updatedMessage;
  }
}
