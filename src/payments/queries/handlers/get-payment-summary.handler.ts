import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPaymentSummaryQuery } from '../impl/get-payment-summary.query';

@QueryHandler(GetPaymentSummaryQuery)
export class GetPaymentSummaryHandler implements IQueryHandler<GetPaymentSummaryQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetPaymentSummaryQuery) {
    const { buildingId } = query;

    const payments = await this.prisma.payment.findMany({
      where: {
        apartment: {
          building_id: buildingId,
        },
      },
      select: {
        status: true,
        amount: true,
      },
    });

    const summary = {
      total_pending: 0,
      total_paid: 0,
      total_overdue: 0,
      count_pending: 0,
      count_paid: 0,
      count_overdue: 0,
    };

    payments.forEach((payment) => {
      const amount = payment.amount.toNumber();
      if (payment.status === 'pending') {
        summary.total_pending += amount;
        summary.count_pending++;
      } else if (payment.status === 'paid') {
        summary.total_paid += amount;
        summary.count_paid++;
      } else if (payment.status === 'overdue') {
        summary.total_overdue += amount;
        summary.count_overdue++;
      }
    });

    return summary;
  }
}
