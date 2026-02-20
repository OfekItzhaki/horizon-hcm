import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetExpenseReportQuery } from '../impl/get-expense-report.query';
import { PrismaService } from '../../../common/services/prisma.service';

@QueryHandler(GetExpenseReportQuery)
export class GetExpenseReportHandler
  implements IQueryHandler<GetExpenseReportQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetExpenseReportQuery) {
    const { buildingId, startDate, endDate } = query;

    // Calculate default date range (current month) if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Get all completed maintenance requests in date range
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        building_id: buildingId,
        status: 'completed',
        completion_date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        category: true,
        estimated_cost: true,
      },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { name: string; total: number; count: number }
    >();

    requests.forEach((request) => {
      const category = request.category;
      const amount = Number(request.estimated_cost || 0);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, total: 0, count: 0 });
      }

      const cat = categoryMap.get(category)!;
      cat.total = Number((cat.total + amount).toFixed(2));
      cat.count += 1;
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
