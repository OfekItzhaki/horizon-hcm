import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetInvoicesQuery } from '../impl/get-invoices.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetInvoicesQuery)
export class GetInvoicesHandler implements IQueryHandler<GetInvoicesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetInvoicesQuery) {
    const { buildingId, apartmentId, status, page, limit } = query;

    const where: any = {};

    if (buildingId) {
      where.building_id = buildingId;
    }

    if (apartmentId) {
      where.apartment_id = apartmentId;
    }

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoices.findMany({
        where,
        include: {
          buildings: true,
          apartments: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoices.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
