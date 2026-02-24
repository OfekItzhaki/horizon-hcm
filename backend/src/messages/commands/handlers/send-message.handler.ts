import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { SendMessageCommand } from '../impl/send-message.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(SendMessageCommand)
export class SendMessageHandler implements ICommandHandler<SendMessageCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: SendMessageCommand) {
    const { buildingId, senderId, recipientId, content } = command;

    // Validate building exists
    const building = await this.prisma.buildings.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new BadRequestException('Building not found');
    }

    // Validate sender and recipient are different
    if (senderId === recipientId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Create message
    const message = await this.prisma.messages.create({
      data: {
        id: uuidv4(),
        building_id: buildingId,
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        is_read: false,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: senderId,
      action: 'message.sent',
      resourceType: 'message',
      resourceId: message.id,
    });

    // Send push notification to recipient
    try {
      // Get sender's name
      const sender = await this.prisma.user_profiles.findUnique({
        where: { id: senderId },
        select: { full_name: true },
      });

      const senderName = sender?.full_name || 'Someone';

      // Send notification
      await this.notificationService.sendTemplatedNotification({
        userId: recipientId,
        templateName: 'new_message',
        variables: {
          senderName,
          messagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        },
      });
    } catch (error) {
      // Log error but don't fail the message sending
      console.error('Failed to send message notification:', error);
    }

    return message;
  }
}
