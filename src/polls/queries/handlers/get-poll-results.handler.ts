import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetPollResultsQuery } from '../impl/get-poll-results.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetPollResultsQuery)
export class GetPollResultsHandler implements IQueryHandler<GetPollResultsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPollResultsQuery) {
    const { pollId, buildingId } = query;

    const poll = await this.prisma.polls.findFirst({
      where: {
        id: pollId,
        building_id: buildingId,
      },
      include: {
        poll_votes: true,
      },
    });

    if (!poll) {
      throw new NotFoundException(`Poll with ID ${pollId} not found`);
    }

    // Calculate vote counts per option
    const options = poll.options as any[];
    const voteCounts = new Map<string, number>();

    // Initialize all options with 0 votes
    options.forEach((option) => {
      voteCounts.set(option.id, 0);
    });

    // Count votes
    poll.poll_votes.forEach((vote) => {
      const optionIds = vote.option_ids as string[];
      optionIds.forEach((optionId) => {
        voteCounts.set(optionId, (voteCounts.get(optionId) || 0) + 1);
      });
    });

    // Build results
    const results = options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: voteCounts.get(option.id) || 0,
      percentage:
        poll.poll_votes.length > 0
          ? ((voteCounts.get(option.id) || 0) / poll.poll_votes.length) * 100
          : 0,
    }));

    return {
      pollId: poll.id,
      title: poll.title,
      totalVotes: poll.poll_votes.length,
      options: results,
      status: poll.status,
      endDate: poll.end_date,
    };
  }
}
