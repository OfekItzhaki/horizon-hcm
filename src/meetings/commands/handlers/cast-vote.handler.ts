import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CastVoteCommand } from '../impl/cast-vote.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(CastVoteCommand)
export class CastVoteHandler implements ICommandHandler<CastVoteCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: CastVoteCommand) {
    const { voteId, userId, selectedOption } = command;

    // Validate vote exists
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new Error('Vote not found');
    }

    // Validate vote is open (not closed)
    if (vote.closed_at) {
      throw new Error('Vote is closed');
    }

    // Validate option is valid
    const options = vote.options as string[];
    if (!options.includes(selectedOption)) {
      throw new Error('Invalid vote option');
    }

    // Check if user already voted
    const existingVote = await this.prisma.voteRecord.findUnique({
      where: {
        vote_id_user_id: {
          vote_id: voteId,
          user_id: userId,
        },
      },
    });

    if (existingVote) {
      throw new Error('User has already voted');
    }

    // Create vote record
    const voteRecord = await this.prisma.voteRecord.create({
      data: {
        vote_id: voteId,
        user_id: userId,
        option: selectedOption,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'vote.cast',
      resourceType: 'vote',
      resourceId: voteId,
    });

    return voteRecord;
  }
}
