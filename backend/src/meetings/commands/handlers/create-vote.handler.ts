import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateVoteCommand } from '../impl/create-vote.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { generateId } from '../../../common/utils/id-generator';

@CommandHandler(CreateVoteCommand)
export class CreateVoteHandler implements ICommandHandler<CreateVoteCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: CreateVoteCommand) {
    const { meetingId, question, options } = command;

    // Validate meeting exists
    const meeting = await this.prisma.meetings.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Create vote
    const vote = await this.prisma.votes.create({
      data: {
        id: generateId(),
        meeting_id: meetingId,
        title: question,
        options,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: meeting.created_by,
      action: 'vote.created',
      resourceType: 'vote',
      resourceId: vote.id,
    });

    return vote;
  }
}
