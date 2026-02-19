import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddMaintenanceCommentCommand } from '../impl/add-maintenance-comment.command';

@CommandHandler(AddMaintenanceCommentCommand)
export class AddMaintenanceCommentHandler
  implements ICommandHandler<AddMaintenanceCommentCommand>
{
  constructor(private prisma: PrismaService) {}

  async execute(command: AddMaintenanceCommentCommand) {
    const { requestId, userId, comment } = command;

    // Check if request exists
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Add comment
    const maintenanceComment = await this.prisma.maintenanceComment.create({
      data: {
        maintenance_request_id: requestId,
        user_id: userId,
        comment,
      },
    });

    // TODO: Send notification to relevant parties
    // await this.notificationService.notifyNewComment(request, maintenanceComment);

    return maintenanceComment;
  }
}
