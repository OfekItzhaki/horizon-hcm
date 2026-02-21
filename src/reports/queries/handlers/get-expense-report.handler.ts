import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetExpenseReportQuery } from '../impl/get-expense-report.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetExpenseReportQuery)
export class GetExpenseReportHandler implements IQueryHandler<GetExpenseReportQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    // Note: Expense tracking not available in current schema
    // Maintenance requests don't have cost fields
    // Returning empty expense report
    const categories = [];
    const grandTotal = 0;

    return {
      categories,
      grandTotal,
    };
  }
}
