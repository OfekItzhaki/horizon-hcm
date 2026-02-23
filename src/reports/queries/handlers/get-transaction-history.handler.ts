import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionHistoryQuery } from '../impl/get-transaction-history.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetTransactionHistoryQuery)
export class GetTransactionHistoryHandler implements IQueryHandler<GetTransactionHistoryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTransactionHistoryQuery) {
    const { buildingId, page, limit, startDate, endDate, transactionType } = query;

    // Calculate default date range (current month) if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Build where clause
    const where: any = {
      apartment: {
        building_id: buildingId,
      },
      created_at: {
        gte: start,
        lte: end,
      },
    };

    if (transactionType) {
      where.payment_type = transactionType;
    }

    // Get total count
    const total = await this.prisma.payments.count({ where });

    // Get paginated transactions
    const transactions = await this.prisma.payments.findMany({
      where,
      include: {
        apartments: {
          select: {
            apartment_number: true,
            building_id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100), // Enforce max 100 items
    });

    return {
      data: transactions.map((t) => ({
        id: t.id,
        apartmentNumber: t.apartments.apartment_number,
        amount: Number(t.amount.toFixed(2)),
        dueDate: t.due_date,
        paidDate: t.paid_date,
        status: t.status,
        paymentType: t.payment_type,
        description: t.description,
        referenceNumber: t.reference_number,
        createdAt: t.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
