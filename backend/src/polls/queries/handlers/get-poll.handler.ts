import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetPollQuery } from '../impl/get-poll.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetPollQuery)
export class GetPollHandler implements IQueryHandler<GetPollQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPollQuery) {
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

    return poll;
  }
}
