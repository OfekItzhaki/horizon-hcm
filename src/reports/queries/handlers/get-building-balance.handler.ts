import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBuildingBalanceQuery } from '../impl/get-building-balance.query';
import { PrismaService } from '../../../common/services/prisma.service';
import { CacheService } from '../../../common/services/cache.service';

@QueryHandler(GetBuildingBalanceQuery)
export class GetBuildingBalanceHandler
  implements IQueryHandler<GetBuildingBalanceQuery>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(query: GetBuildingBalanceQuery) {
    const { buildingId } = query;
    const cacheKey = `balance:${buildingId}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate total income (paid payments)
    const totalIncome = await this.prisma.payment.aggregate({
      where: {
        building_id: buildingId,
        status: 'paid',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total expenses (completed maintenance requests)
    const totalExpenses = await this.prisma.maintenanceRequest.aggregate({
      where: {
        building_id: buildingId,
        status: 'completed',
      },
      _sum: {
        estimated_cost: true,
      },
    });

    const income = totalIncome._sum.amount || 0;
    const expenses = totalExpenses._sum.estimated_cost || 0;
    const balance = Number((income - expenses).toFixed(2));

    const result = {
      balance,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }
}
