import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListDocumentsQuery } from '../impl/list-documents.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(ListDocumentsQuery)
export class ListDocumentsHandler implements IQueryHandler<ListDocumentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListDocumentsQuery) {
    const { buildingId, category, accessLevel, page, limit } = query;

    const where: any = { building_id: buildingId };
    if (category) {
      where.category = category;
    }
    if (accessLevel) {
      where.access_level = accessLevel;
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
