import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetYearOverYearQuery } from '../impl/get-year-over-year.query';
import { PrismaService } from '../../../common/services/prisma.service';

@QueryHandler(GetYearOverYearQuery)
export class GetYearOverYearHandler
  implements IQueryHandler<GetYearOverYearQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetYearOverYearQuery) {
    const { buildingId, year } = query;

    const currentYear = year || new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Calculate current year income and expenses
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);

    const currentIncome = await this.prisma.payment.aggregate({
      where: {
        apartment: { building_id: buildingId },
        status: 'paid',
        paid_date: { gte: currentYearStart, lte: currentYearEnd },
      },
      _sum: { amount: true },
    });

    const currentExpenses = await this.prisma.maintenanceRequest.aggregate({
      where: {
        building_id: buildingId,
        status: 'completed',
        completion_date: { gte: currentYearStart, lte: currentYearEnd },
      },
      _sum: { estimated_cost: true },
    });

    // Calculate previous year income and expenses
    const previousYearStart = new Date(previousYear, 0, 1);
    const previousYearEnd = new Date(previousYear, 11, 31);

    const previousIncome = await this.prisma.payment.aggregate({
      where: {
        apartment: { building_id: buildingId },
        status: 'paid',
        paid_date: { gte: previousYearStart, lte: previousYearEnd },
      },
      _sum: { amount: true },
    });

    const previousExpenses = await this.prisma.maintenanceRequest.aggregate({
      where: {
        building_id: buildingId,
        status: 'completed',
        completion_date: { gte: previousYearStart, lte: previousYearEnd },
      },
      _sum: { estimated_cost: true },
    });

    const currentIncomeAmount = Number(
      (currentIncome._sum.amount || 0).toFixed(2),
    );
    const currentExpensesAmount = Number(
      (currentExpenses._sum.estimated_cost || 0).toFixed(2),
    );
    const previousIncomeAmount = Number(
      (previousIncome._sum.amount || 0).toFixed(2),
    );
    const previousExpensesAmount = Number(
      (previousExpenses._sum.estimated_cost || 0).toFixed(2),
    );

    // Calculate changes
    const incomeChange = Number(
      (currentIncomeAmount - previousIncomeAmount).toFixed(2),
    );
    const expensesChange = Number(
      (currentExpensesAmount - previousExpensesAmount).toFixed(2),
    );

    const incomeChangePercent =
      previousIncomeAmount > 0
        ? Number(((incomeChange / previousIncomeAmount) * 100).toFixed(1))
        : 0;
    const expensesChangePercent =
      previousExpensesAmount > 0
        ? Number(((expensesChange / previousExpensesAmount) * 100).toFixed(1))
        : 0;

    // Generate monthly breakdown for current year
    const monthlyBreakdown = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);

      const monthIncome = await this.prisma.payment.aggregate({
        where: {
          apartment: { building_id: buildingId },
          status: 'paid',
          paid_date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      const monthExpenses = await this.prisma.maintenanceRequest.aggregate({
        where: {
          building_id: buildingId,
          status: 'completed',
          completion_date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { estimated_cost: true },
      });

      monthlyBreakdown.push({
        month: month + 1,
        income: Number((monthIncome._sum.amount || 0).toFixed(2)),
        expenses: Number((monthExpenses._sum.estimated_cost || 0).toFixed(2)),
      });
    }

    return {
      currentYear: {
        income: currentIncomeAmount,
        expenses: currentExpensesAmount,
      },
      previousYear: {
        income: previousIncomeAmount,
        expenses: previousExpensesAmount,
      },
      change: {
        income: incomeChange,
        expenses: expensesChange,
      },
      changePercent: {
        income: incomeChangePercent,
        expenses: expensesChangePercent,
      },
      monthlyBreakdown,
    };
  }
}
