import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetIncomeReportQuery } from '../impl/get-income-report.query';
import { PrismaService } from '../../../common/services/prisma.service';

@QueryHandler(GetIncomeReportQuery)
export class GetIncomeReportHandler
  implements IQueryHandler<GetIncomeReportQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetIncomeReportQuery) {
    const { buildingId, startDate, endDate } = query;

    // Calculate default date range (current month) if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Get all paid payments in date range
    const payments = await this.prisma.payment.findMany({
      where: {
        apartment: {
          building_id: buildingId,
        },
        status: 'paid',
        paid_date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        payment_type: true,
        amount: true,
      },
    });

    // Group by payment type
    const categoryMap = new Map<
      string,
      { name: string; total: number; count: number }
    >();

    payments.forEach((payment) => {
      const type = payment.payment_type;
      const amount = Number(payment.amount);

      if (!categoryMap.has(type)) {
        categoryMap.set(type, { name: type, total: 0, count: 0 });
      }

      const category = categoryMap.get(type)!;
      category.total = Number((category.total + amount).toFixed(2));
      category.count += 1;
    });

    // Convert to array and sort by total DESC
    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total,
    );

    // Calculate grand total
    const grandTotal = Number(
      categories.reduce((sum, cat) => sum + cat.total, 0).toFixed(2),
    );

    return {
      categories,
      grandTotal,
    };
  }
}
