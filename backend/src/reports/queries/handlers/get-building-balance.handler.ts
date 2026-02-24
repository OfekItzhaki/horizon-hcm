import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBuildingBalanceQuery } from '../impl/get-building-balance.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';

/**
 * Query handler that calculates the current balance for a building.
 * 
 * Calculates balance from paid payments (income) associated with the building's apartments.
 * Results are cached for 5 minutes to improve performance.
 * 
 * Note: Expense tracking is not yet implemented in the schema, so balance
 * is currently calculated from income only.
 * 
 * @example
 * ```typescript
 * const query = new GetBuildingBalanceQuery('building-123');
 * const result = await queryBus.execute(query);
 * // Returns: { balance: 15000.50, lastUpdated: '2024-02-24T10:30:00Z' }
 * ```
 */
@QueryHandler(GetBuildingBalanceQuery)
export class GetBuildingBalanceHandler implements IQueryHandler<GetBuildingBalanceQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Executes the query to get building balance.
   * 
   * @param query - Query containing the building ID
   * @returns Object with balance and last updated timestamp
   */
  async execute(query: GetBuildingBalanceQuery) {
    const { buildingId } = query;
    const cacheKey = `balance:${buildingId}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached && typeof cached === 'string') {
      return JSON.parse(cached);
    }

    // Calculate total income (paid payments via apartments)
    const totalIncome = await this.prisma.payments.aggregate({
      where: {
        apartments: {
          building_id: buildingId,
        },
        status: 'paid',
      },
      _sum: {
        amount: true,
      },
    });

    const income = totalIncome._sum.amount || 0;

    // Note: Expense tracking not available in current schema
    // Balance calculated from payments only
    const balance = Number(income.toFixed(2));

    const result = {
      balance,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }
}
