import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListPaymentsQuery } from '../impl/list-payments.query';

@QueryHandler(ListPaymentsQuery)
export class ListPaymentsHandler implements IQueryHandler<ListPaymentsQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: ListPaymentsQuery) {
    const { apartmentId, buildingId, status, page, limit } = query;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (apartmentId) {
      where.apartment_id = apartmentId;
    }
    if (buildingId) {
      where.apartment = { building_id: buildingId };
    }
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          apartment: {
            select: {
              id: true,
              apartment_number: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  address_line: true,
                },
              },
            },
          },
        },
        orderBy: { due_date: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
