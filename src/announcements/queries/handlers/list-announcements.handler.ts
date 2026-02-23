import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListAnnouncementsQuery } from '../impl/list-announcements.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(ListAnnouncementsQuery)
export class ListAnnouncementsHandler implements IQueryHandler<ListAnnouncementsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListAnnouncementsQuery) {
    const { buildingId, category, isUrgent, page, limit } = query;

    const where: any = {
      building_id: buildingId,
      deleted_at: null, // Only show non-deleted announcements
    };
    if (category) {
      where.category = category;
    }
    if (isUrgent !== undefined) {
      where.is_urgent = isUrgent;
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcements.findMany({
        where,
        include: {
          read_receipts: true,
          comments: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcements.count({ where }),
    ]);

    return {
      data: announcements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
