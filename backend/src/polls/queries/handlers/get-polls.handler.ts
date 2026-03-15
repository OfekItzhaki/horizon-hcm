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
      data: polls.map((poll) => {
        // options is stored as Json — ensure it's always an array
        const options: any[] = Array.isArray(poll.options)
          ? poll.options
          : typeof poll.options === 'string'
          ? JSON.parse(poll.options)
          : [];

        // Count votes per option from poll_votes
        const voteCounts: Record<string, number> = {};
        for (const vote of poll.poll_votes) {
          const optionIds: string[] = Array.isArray(vote.option_ids)
            ? vote.option_ids
            : typeof vote.option_ids === 'string'
            ? JSON.parse(vote.option_ids)
            : [];
          for (const optId of optionIds) {
            voteCounts[optId] = (voteCounts[optId] || 0) + 1;
          }
        }

        return {
          id: poll.id,
          buildingId: poll.building_id,
          question: poll.title,
          type: poll.allow_multiple ? 'multiple_choice' : 'single_choice',
          startDate: poll.start_date,
          endDate: poll.end_date,
          status: poll.status,
          createdBy: poll.created_by,
          createdAt: poll.created_at,
          options: options.map((opt: any) => ({
            id: opt.id || opt.text,
            text: opt.text || opt.label || String(opt),
            votes: voteCounts[opt.id || opt.text] || 0,
          })),
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
