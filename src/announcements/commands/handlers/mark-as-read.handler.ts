import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MarkAsReadCommand } from '../impl/mark-as-read.command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler implements ICommandHandler<MarkAsReadCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: MarkAsReadCommand) {
    const { announcementId, userId } = command;

    // Validate announcement exists
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Create or update read receipt
    const readReceipt = await this.prisma.announcement_reads.upsert({
      where: {
        announcement_id_user_id: {
          announcement_id: announcementId,
          user_id: userId,
        },
      },
      update: {
        read_at: new Date(),
      },
      create: {
        announcement_id: announcementId,
        user_id: userId,
      },
    });

    return readReceipt;
  }
}
