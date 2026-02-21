import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBudgetComparisonQuery } from '../impl/get-budget-comparison.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetBudgetComparisonQuery)
export class GetBudgetComparisonHandler implements IQueryHandler<GetBudgetComparisonQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetBudgetComparisonQuery) {
    const { buildingId, startDate, endDate } = query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get building budget configuration
    // Note: budget_config field doesn't exist in current schema
    // For now, we'll use empty config (all budgeted amounts will be null)
    const budgetConfig: any = {};

    // Calculate actual income
    const actualIncome = await this.prisma.payment.aggregate({
      where: {
        apartment: { building_id: buildingId },
        status: 'paid',
        paid_date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    // Calculate actual expenses
    const actualExpenses = await this.prisma.maintenanceRequest.aggregate({
      where: {
        building_id: buildingId,
        status: 'completed',
        completion_date: { gte: start, lte: end },
      },
      _sum: { estimated_cost: true },
    });

    const actualIncomeAmount = Number((actualIncome._sum.amount || 0).toFixed(2));
    const actualExpensesAmount = Number((actualExpenses._sum.estimated_cost || 0).toFixed(2));

    // Build comparison categories
    const categories = [];

    // Income comparison
    const budgetedIncome = budgetConfig.income || null;
    if (budgetedIncome !== null) {
      const variance = Number((actualIncomeAmount - budgetedIncome).toFixed(2));
      const variancePercent = Number(((variance / budgetedIncome) * 100).toFixed(1));
      categories.push({
        name: 'Income',
        budgeted: budgetedIncome,
        actual: actualIncomeAmount,
        variance,
        variancePercent,
        isFavorable: variance >= 0, // Income over budget is favorable
      });
    } else {
      categories.push({
        name: 'Income',
        budgeted: null,
        actual: actualIncomeAmount,
        variance: null,
        variancePercent: null,
        isFavorable: null,
      });
    }

    // Expenses comparison
    const budgetedExpenses = budgetConfig.expenses || null;
    if (budgetedExpenses !== null) {
      const variance = Number((actualExpensesAmount - budgetedExpenses).toFixed(2));
      const variancePercent = Number(((variance / budgetedExpenses) * 100).toFixed(1));
      categories.push({
        name: 'Expenses',
        budgeted: budgetedExpenses,
        actual: actualExpensesAmount,
        variance,
        variancePercent,
        isFavorable: variance <= 0, // Expenses under budget is favorable
      });
    } else {
      categories.push({
        name: 'Expenses',
        budgeted: null,
        actual: actualExpensesAmount,
        variance: null,
        variancePercent: null,
        isFavorable: null,
      });
    }

    return { categories };
  }
}
