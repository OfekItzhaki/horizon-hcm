import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPaymentStatusSummaryQuery } from '../impl/get-payment-status-summary.query';
import { PrismaService } from '../../../common/services/prisma.service';
import { CacheService } from '../../../common/services/cache.service';

@QueryHandler(GetPaymentStatusSummaryQuery)
export class GetPaymentStatusSummaryHandler
  implements IQueryHandler<GetPaymentStatusSummaryQuery>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(query: GetPaymentStatusSummaryQuery) {
    const { buildingId, startDate, endDate } = query;

    // Calculate default date range (current month) if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    const dateRange = `${start.toISOString()}-${end.toISOString()}`;
    const cacheKey = `payment-summary:${buildingId}:${dateRange}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all payments in date range
    const payments = await this.prisma.payment.findMany({
      where: {
        apartment: {
          building_id: buildingId,
        },
        due_date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        status: true,
        amount: true,
      },
    });

    // Group by status
    const statusMap = new Map<
      string,
      { amount: number; count: number }
    >();

    let totalAmount = 0;
    let paidAmount = 0;

    payments.forEach((payment) => {
      const status = payment.status;
      const amount = Number(payment.amount);

      if (!statusMap.has(status)) {
        statusMap.set(status, { amount: 0, count: 0 });
      }

      const group = statusMap.get(status)!;
      group.amount = Number((group.amount + amount).toFixed(2));
      group.count += 1;

      totalAmount += amount;
      if (status === 'paid') {
        paidAmount += amount;
      }
    });

    // Calculate collection rate
    const collectionRate =
      totalAmount > 0
        ? Number(((paidAmount / totalAmount) * 100).toFixed(1))
        : 0;

    const result = {
      pending: statusMap.get('pending') || { amount: 0, count: 0 },
      paid: statusMap.get('paid') || { amount: 0, count: 0 },
      overdue: statusMap.get('overdue') || { amount: 0, count: 0 },
      collectionRate,
    };

    // Cache for 10 minutes
    await this.cache.set(cacheKey, JSON.stringify(result), 600);

    return result;
  }
}
