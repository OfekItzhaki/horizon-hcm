import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListApartmentsQuery } from '../impl/list-apartments.query';

@QueryHandler(ListApartmentsQuery)
export class ListApartmentsHandler implements IQueryHandler<ListApartmentsQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: ListApartmentsQuery) {
    const { buildingId, page, limit, isVacant } = query;

    const skip = (page - 1) * limit;

    const where: any = { building_id: buildingId };
    if (isVacant !== undefined) {
      where.is_vacant = isVacant;
    }

    const [apartments, total] = await Promise.all([
      this.prisma.apartments.findMany({
        where,
        skip,
        take: limit,
        include: {
          apartment_owners: {
            select: {
              id: true,
              ownership_share: true,
              is_primary: true,
              user_profile: {
                select: {
                  id: true,
                  full_name: true,
                },
              },
            },
          },
          tenants: {
            where: { is_active: true },
            select: {
              id: true,
              user_profile: {
                select: {
                  id: true,
                  full_name: true,
                },
              },
            },
          },
        },
        orderBy: { apartment_number: 'asc' },
      }),
      this.prisma.apartments.count({ where }),
    ]);

    return {
      data: apartments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
