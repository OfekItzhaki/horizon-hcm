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
          meeting_attendees: true,
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
      data: meetings.map((m) => ({
        id: m.id,
        buildingId: m.building_id,
        title: m.title,
        description: m.description,
        // Normalize meeting_date → date for frontend compatibility
        date: m.meeting_date,
        location: m.location,
        status: m.status,
        createdBy: m.created_by,
        createdAt: m.created_at,
        cancelledAt: m.status === 'cancelled' ? m.updated_at : null,
        attendees: m.meeting_attendees,
        agendaItems: m.agenda_items,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
