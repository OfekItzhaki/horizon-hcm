import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeletePollCommand } from '../impl/delete-poll.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(DeletePollCommand)
export class DeletePollHandler implements ICommandHandler<DeletePollCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: DeletePollCommand) {
    const { pollId, userId } = command;

    // Find poll
    const poll = await this.prisma.polls.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user is the creator
    if (poll.created_by !== userId) {
      throw new ForbiddenException('Only the poll creator can delete it');
    }

    // Delete poll (cascade will delete votes)
    await this.prisma.polls.delete({
      where: { id: pollId },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'poll.deleted',
      resourceType: 'poll',
      resourceId: pollId,
    });

    return { message: 'Poll deleted successfully' };
  }
}
