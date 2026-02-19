import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetVoteResultsQuery } from '../impl/get-vote-results.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetVoteResultsQuery)
export class GetVoteResultsHandler implements IQueryHandler<GetVoteResultsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetVoteResultsQuery) {
    const { voteId } = query;

    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        vote_records: true,
      },
    });

    if (!vote) {
      throw new Error('Vote not found');
    }

    // Calculate results
    const options = vote.options as string[];
    const results = options.map(option => ({
      option,
      count: vote.vote_records.filter(r => r.option === option).length,
    }));

    return {
      vote: {
        id: vote.id,
        title: vote.title,
        closed: !!vote.closed_at,
      },
      results,
      totalVotes: vote.vote_records.length,
    };
  }
}
