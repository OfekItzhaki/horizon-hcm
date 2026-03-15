import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListBuildingsQuery } from '../impl/list-buildings.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(ListBuildingsQuery)
export class ListBuildingsHandler implements IQueryHandler<ListBuildingsQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: ListBuildingsQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address_line: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [buildings, total] = await Promise.all([
      this.prisma.buildings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { apartments: true } },
        },
      }),
      this.prisma.buildings.count({ where }),
    ]);

    return {
      data: buildings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
