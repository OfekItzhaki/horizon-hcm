import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { generateId } from '../../../common/utils/id-generator';
import { VotePollCommand } from '../impl/vote-poll.command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(VotePollCommand)
export class VotePollHandler implements ICommandHandler<VotePollCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: VotePollCommand) {
    const { pollId, userId, optionIds } = command;

    // Find poll
    const poll = await this.prisma.polls.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll is still active
    if (poll.status !== 'active') {
      throw new BadRequestException('Poll is closed');
    }

    // Check if poll has ended
    if (new Date() > new Date(poll.end_date)) {
      // Auto-close the poll
      await this.prisma.polls.update({
        where: { id: pollId },
        data: { status: 'closed', updated_at: new Date() },
      });
      throw new BadRequestException('Poll has ended');
    }

    // Validate option IDs
    const pollOptions = poll.options as any[];
    const validOptionIds = pollOptions.map((o: any) => o.id);
    const invalidOptions = optionIds.filter((id) => !validOptionIds.includes(id));

    if (invalidOptions.length > 0) {
      throw new BadRequestException(`Invalid option IDs: ${invalidOptions.join(', ')}`);
    }

    // Check if multiple selections are allowed
    if (!poll.allow_multiple && optionIds.length > 1) {
      throw new BadRequestException('This poll only allows single selection');
    }

    // Check if user has already voted
    const existingVote = await this.prisma.poll_votes.findUnique({
      where: {
        poll_id_user_id: {
          poll_id: pollId,
          user_id: userId,
        },
      },
    });

    if (existingVote) {
      // Update existing vote
      await this.prisma.poll_votes.update({
        where: { id: existingVote.id },
        data: {
          option_ids: optionIds,
        },
      });

      // Update vote counts
      await this.updateVoteCounts(pollId);

      return {
        message: 'Vote updated successfully',
        pollId,
        optionIds,
      };
    } else {
      // Create new vote
      await this.prisma.poll_votes.create({
        data: {
          id: generateId(),
          poll_id: pollId,
          user_id: userId,
          option_ids: optionIds,
        },
      });

      // Update vote counts
      await this.updateVoteCounts(pollId);

      return {
        message: 'Vote recorded successfully',
        pollId,
        optionIds,
      };
    }
  }

  private async updateVoteCounts(pollId: string) {
    // Get all votes for this poll
    const votes = await this.prisma.poll_votes.findMany({
      where: { poll_id: pollId },
    });

    // Get poll
    const poll = await this.prisma.polls.findUnique({
      where: { id: pollId },
    });

    if (!poll) return;

    // Count votes for each option
    const pollOptions = poll.options as any[];
    const voteCounts: Record<string, number> = {};

    pollOptions.forEach((option: any) => {
      voteCounts[option.id] = 0;
    });

    votes.forEach((vote) => {
      const optionIds = vote.option_ids as string[];
      optionIds.forEach((optionId) => {
        if (voteCounts[optionId] !== undefined) {
          voteCounts[optionId]++;
        }
      });
    });

    // Update poll options with new vote counts
    const updatedOptions = pollOptions.map((option: any) => ({
      ...option,
      votes: voteCounts[option.id] || 0,
    }));

    await this.prisma.polls.update({
      where: { id: pollId },
      data: {
        options: updatedOptions,
        updated_at: new Date(),
      },
    });
  }
}
