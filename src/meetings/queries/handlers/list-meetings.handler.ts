import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListMeetingsQuery } from '../impl/list-meetings.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(ListMeetingsQuery)
export class ListMeetingsHandler implements IQueryHandler<ListMeetingsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListMeetingsQuery) {
    const { buildingId, status, page, limit } = query;

    const where: any = { building_id: buildingId };
    if (status) {
      where.status = status;
    }

    const [meetings, total] = await Promise.all([
      this.prisma.meetings.findMany({
        where,
        include: {
          attendees: true,
          agenda_items: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { meeting_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.meetings.count({ where }),
    ]);

    return {
      data: meetings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
