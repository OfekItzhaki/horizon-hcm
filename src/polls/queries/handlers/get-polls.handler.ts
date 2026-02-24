import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetPollsQuery } from '../impl/get-polls.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetPollsQuery)
export class GetPollsHandler implements IQueryHandler<GetPollsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPollsQuery) {
    const { buildingId, status, page, limit } = query;

    const where: any = {
      building_id: buildingId,
    };

    if (status) {
      where.status = status;
    }

    const [polls, total] = await Promise.all([
      this.prisma.polls.findMany({
        where,
        include: {
          poll_votes: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.polls.count({ where }),
    ]);

    return {
      data: polls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
