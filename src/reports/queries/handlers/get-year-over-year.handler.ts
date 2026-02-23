import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetYearOverYearQuery } from '../impl/get-year-over-year.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetYearOverYearQuery)
export class GetYearOverYearHandler implements IQueryHandler<GetYearOverYearQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetYearOverYearQuery) {
    const { buildingId, year } = query;

    const currentYear = year || new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Calculate current year income and expenses
    const currentYearStart = new Date(currentYear, 0, 1);
    const currentYearEnd = new Date(currentYear, 11, 31);

    const currentIncome = await this.prisma.payments.aggregate({
      where: {
        apartments: { building_id: buildingId },
        status: 'paid',
        paid_date: { gte: currentYearStart, lte: currentYearEnd },
      },
      _sum: { amount: true },
    });

    // Note: Expense tracking not available in current schema
    const currentIncomeAmount = Number((currentIncome._sum.amount || 0).toFixed(2));
    const currentExpensesAmount = 0;

    // Calculate previous year income
    const previousYearStart = new Date(previousYear, 0, 1);
    const previousYearEnd = new Date(previousYear, 11, 31);

    const previousIncome = await this.prisma.payments.aggregate({
      where: {
        apartments: { building_id: buildingId },
        status: 'paid',
        paid_date: { gte: previousYearStart, lte: previousYearEnd },
      },
      _sum: { amount: true },
    });

    const previousIncomeAmount = Number((previousIncome._sum.amount || 0).toFixed(2));
    const previousExpensesAmount = 0;

    // Calculate changes
    const incomeChange = Number((currentIncomeAmount - previousIncomeAmount).toFixed(2));
    const expensesChange = Number((currentExpensesAmount - previousExpensesAmount).toFixed(2));

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

      const monthIncome = await this.prisma.payments.aggregate({
        where: {
          apartments: { building_id: buildingId },
          status: 'paid',
          paid_date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      monthlyBreakdown.push({
        month: month + 1,
        income: Number((monthIncome._sum.amount || 0).toFixed(2)),
        expenses: 0, // Expense tracking not available
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
