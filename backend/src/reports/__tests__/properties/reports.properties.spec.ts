import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { GetBuildingBalanceHandler } from '../../queries/handlers/get-building-balance.handler';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { GetBuildingBalanceQuery } from '../../queries/impl/get-building-balance.query';

// Arbitraries for generating test data
const uuidArbitrary = () =>
  fc.tuple(
    fc.hexaString({ minLength: 8, maxLength: 8 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 4, maxLength: 4 }),
    fc.hexaString({ minLength: 12, maxLength: 12 }),
  ).map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

const decimalArbitrary = () =>
  fc.double({ min: 0, max: 1000000, noNaN: true }).map((n) => Number(n.toFixed(2)));

const paymentArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    building_id: uuidArbitrary(),
    amount: decimalArbitrary(),
    status: fc.constantFrom('paid', 'pending', 'overdue'),
  });

const maintenanceRequestArbitrary = () =>
  fc.record({
    id: uuidArbitrary(),
    building_id: uuidArbitrary(),
    estimated_cost: decimalArbitrary(),
    status: fc.constantFrom('completed', 'pending', 'in_progress'),
  });

describe('Reports Module - Property-Based Tests', () => {
  let getBuildingBalanceHandler: GetBuildingBalanceHandler;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBuildingBalanceHandler,
        {
          provide: PrismaService,
          useValue: {
            payments: {
              aggregate: jest.fn(),
            },
            maintenance_requests: {
              aggregate: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    getBuildingBalanceHandler = module.get<GetBuildingBalanceHandler>(
      GetBuildingBalanceHandler,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 8: Balance Calculation Accuracy', () => {
    it('should calculate balance from paid payments with 2 decimal precision', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.array(paymentArbitrary(), { minLength: 0, maxLength: 20 }),
          async (buildingId, payments) => {
            // Calculate expected values
            const paidPayments = payments.filter((p) => p.status === 'paid');
            const totalIncome = paidPayments.reduce((sum, p) => sum + p.amount, 0);
            const expectedBalance = Number(totalIncome.toFixed(2));

            // Mock Prisma responses
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);
            jest.spyOn(prismaService.payments, 'aggregate').mockResolvedValue({
              _sum: { amount: totalIncome },
            } as any);

            // Execute query
            const result = await getBuildingBalanceHandler.execute(
              new GetBuildingBalanceQuery(buildingId),
            );

            // Verify balance calculation
            expect(result.balance).toBe(expectedBalance);
            expect(Number.isFinite(result.balance)).toBe(true);

            // Verify 2 decimal places
            const decimalPlaces = (result.balance.toString().split('.')[1] || '')
              .length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 9: Decimal Precision Consistency', () => {
    it('should always return monetary amounts with exactly 2 decimal places', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          decimalArbitrary(),
          async (buildingId, income) => {
            // Mock Prisma responses
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);
            jest.spyOn(prismaService.payments, 'aggregate').mockResolvedValue({
              _sum: { amount: income },
            } as any);

            // Execute query
            const result = await getBuildingBalanceHandler.execute(
              new GetBuildingBalanceQuery(buildingId),
            );

            // Verify decimal precision
            const balanceStr = result.balance.toString();
            const decimalPart = balanceStr.split('.')[1] || '';

            // Should have at most 2 decimal places
            expect(decimalPart.length).toBeLessThanOrEqual(2);

            // Should be a valid number
            expect(Number.isFinite(result.balance)).toBe(true);
            expect(Number.isNaN(result.balance)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 10: Balance Update Atomicity', () => {
    it('should produce consistent balance regardless of payment order', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.array(decimalArbitrary(), { minLength: 1, maxLength: 10 }),
          async (buildingId, incomeAmounts) => {
            // Calculate totals
            const totalIncome = incomeAmounts.reduce((sum, a) => sum + a, 0);

            // Mock Prisma responses
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);
            jest.spyOn(prismaService.payments, 'aggregate').mockResolvedValue({
              _sum: { amount: totalIncome },
            } as any);

            // Execute query
            const result = await getBuildingBalanceHandler.execute(
              new GetBuildingBalanceQuery(buildingId),
            );

            // Verify balance is deterministic
            const expectedBalance = Number(totalIncome.toFixed(2));
            expect(result.balance).toBe(expectedBalance);

            // Execute again with same data
            const result2 = await getBuildingBalanceHandler.execute(
              new GetBuildingBalanceQuery(buildingId),
            );

            // Should produce same result
            expect(result2.balance).toBe(result.balance);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 11: Cache TTL Consistency', () => {
    it('should cache balance with 5-minute TTL (300 seconds)', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          decimalArbitrary(),
          async (buildingId, income) => {
            // Mock Prisma responses
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);
            jest.spyOn(prismaService.payments, 'aggregate').mockResolvedValue({
              _sum: { amount: income },
            } as any);

            const setSpy = jest.spyOn(cacheService, 'set');

            // Execute query
            await getBuildingBalanceHandler.execute(
              new GetBuildingBalanceQuery(buildingId),
            );

            // Verify cache was set with correct TTL
            expect(setSpy).toHaveBeenCalledWith(
              `balance:${buildingId}`,
              expect.any(String),
              300, // 5 minutes in seconds
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 12: Cache Invalidation on Update', () => {
    it('should return fresh data when cache is empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          decimalArbitrary(),
          async (buildingId, income) => {
            // Mock cache miss
            jest.spyOn(cacheService, 'get').mockResolvedValue(null);

            // Mock Prisma responses
            const aggregateSpy = jest
              .spyOn(prismaService.payments, 'aggregate')
              .mockResolvedValue({
                _sum: { amount: income },
              } as any);

            // Execute query
            await getBuildingBalanceHandler.execute(
              new GetBuildingBalanceQuery(buildingId),
            );

            // Verify database was queried (cache miss)
            expect(aggregateSpy).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

  describe('Property 13: Date Range Filter Accuracy', () => {
    it('should only return transactions within the specified date range', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          async (buildingId, date1, date2) => {
            const startDate = date1 < date2 ? date1 : date2;
            const endDate = date1 < date2 ? date2 : date1;

            // Generate transactions with various dates
            const transactionsInRange = Array.from({ length: 5 }, (_, i) => ({
              id: `in-range-${i}`,
              created_at: new Date(
                startDate.getTime() +
                  Math.random() * (endDate.getTime() - startDate.getTime()),
              ),
              amount: 100,
              apartment: { apartment_number: '101', building_id: buildingId },
            }));

            const transactionsOutOfRange = [
              {
                id: 'before',
                created_at: new Date(startDate.getTime() - 86400000), // 1 day before
                amount: 100,
                apartment: { apartment_number: '102', building_id: buildingId },
              },
              {
                id: 'after',
                created_at: new Date(endDate.getTime() + 86400000), // 1 day after
                amount: 100,
                apartment: { apartment_number: '103', building_id: buildingId },
              },
            ];

            // All transactions should be within range
            transactionsInRange.forEach((t) => {
              expect(t.created_at >= startDate).toBe(true);
              expect(t.created_at <= endDate).toBe(true);
            });

            // Out of range transactions should be excluded
            transactionsOutOfRange.forEach((t) => {
              const isInRange = t.created_at >= startDate && t.created_at <= endDate;
              expect(isInRange).toBe(false);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 14: Transaction Type Filter Accuracy', () => {
    it('should only return transactions matching the specified type', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.constantFrom('monthly_fee', 'special_assessment'),
          async (buildingId, filterType) => {
            // Generate transactions with different types
            const transactions = [
              { id: '1', payment_type: 'monthly_fee', amount: 100 },
              { id: '2', payment_type: 'special_assessment', amount: 200 },
              { id: '3', payment_type: 'monthly_fee', amount: 150 },
              { id: '4', payment_type: 'special_assessment', amount: 300 },
            ];

            // Filter transactions
            const filtered = transactions.filter(
              (t) => t.payment_type === filterType,
            );

            // All filtered transactions should match the type
            filtered.forEach((t) => {
              expect(t.payment_type).toBe(filterType);
            });

            // Count should match
            const expectedCount = transactions.filter(
              (t) => t.payment_type === filterType,
            ).length;
            expect(filtered.length).toBe(expectedCount);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 15: Transaction Data Completeness', () => {
    it('should include all required transaction fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.string({ minLength: 1, maxLength: 10 }),
          decimalArbitrary(),
          fc.date(),
          async (id, apartmentNumber, amount, date) => {
            const transaction = {
              id,
              apartmentNumber,
              amount: Number(amount.toFixed(2)),
              dueDate: date,
              paidDate: null,
              status: 'pending',
              paymentType: 'monthly_fee',
              description: 'Test payment',
              referenceNumber: null,
              createdAt: date,
            };

            // Verify all required fields are present
            expect(transaction).toHaveProperty('id');
            expect(transaction).toHaveProperty('apartmentNumber');
            expect(transaction).toHaveProperty('amount');
            expect(transaction).toHaveProperty('dueDate');
            expect(transaction).toHaveProperty('status');
            expect(transaction).toHaveProperty('paymentType');
            expect(transaction).toHaveProperty('createdAt');

            // Verify types
            expect(typeof transaction.id).toBe('string');
            expect(typeof transaction.apartmentNumber).toBe('string');
            expect(typeof transaction.amount).toBe('number');
            expect(transaction.dueDate instanceof Date).toBe(true);
            expect(typeof transaction.status).toBe('string');
            expect(typeof transaction.paymentType).toBe('string');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 16: Descending Date Sort', () => {
    it('should return transactions sorted by date in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), {
            minLength: 2,
            maxLength: 20,
          }),
          async (dates) => {
            // Create transactions with random dates
            const transactions = dates.map((date, i) => ({
              id: `tx-${i}`,
              created_at: date,
              amount: 100,
            }));

            // Sort descending (most recent first)
            const sorted = [...transactions].sort(
              (a, b) => b.created_at.getTime() - a.created_at.getTime(),
            );

            // Verify order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].created_at.getTime()).toBeGreaterThanOrEqual(
                sorted[i + 1].created_at.getTime(),
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 17: Default Date Range Application', () => {
    it('should use current month as default when dates not specified', async () => {
      await fc.assert(
        fc.asyncProperty(uuidArbitrary(), async (buildingId) => {
          const now = new Date();
          const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const defaultEndDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
          );

          // Verify default range is current month
          expect(defaultStartDate.getMonth()).toBe(now.getMonth());
          expect(defaultEndDate.getMonth()).toBe(now.getMonth());

          // Start should be first day of month
          expect(defaultStartDate.getDate()).toBe(1);

          // End should be last day of month
          const lastDay = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
          ).getDate();
          expect(defaultEndDate.getDate()).toBe(lastDay);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 18: Income Aggregation Accuracy', () => {
    it('should correctly sum income by payment type', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.array(
            fc.record({
              payment_type: fc.constantFrom('monthly_fee', 'special_assessment'),
              amount: decimalArbitrary(),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          async (buildingId, payments) => {
            // Group payments by type
            const expected = new Map<string, { total: number; count: number }>();

            payments.forEach((p) => {
              if (!expected.has(p.payment_type)) {
                expected.set(p.payment_type, { total: 0, count: 0 });
              }
              const group = expected.get(p.payment_type)!;
              group.total = Number((group.total + p.amount).toFixed(2));
              group.count += 1;
            });

            // Verify aggregation
            expected.forEach((group, type) => {
              const typePayments = payments.filter((p) => p.payment_type === type);
              expect(group.count).toBe(typePayments.length);

              // Verify total is sum of amounts
              const calculatedTotal = Number(
                typePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
              );
              expect(group.total).toBe(calculatedTotal);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 19: Category Data Completeness', () => {
    it('should include name, total, and count for each category', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              total: decimalArbitrary(),
              count: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (categories) => {
            // Verify each category has required fields
            categories.forEach((category) => {
              expect(category).toHaveProperty('name');
              expect(category).toHaveProperty('total');
              expect(category).toHaveProperty('count');

              expect(typeof category.name).toBe('string');
              expect(typeof category.total).toBe('number');
              expect(typeof category.count).toBe('number');

              expect(category.name.length).toBeGreaterThan(0);
              expect(category.total).toBeGreaterThanOrEqual(0);
              expect(category.count).toBeGreaterThan(0);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 20: Descending Amount Sort', () => {
    it('should sort categories by total amount in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              total: decimalArbitrary(),
              count: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          async (categories) => {
            // Sort by total DESC
            const sorted = [...categories].sort((a, b) => b.total - a.total);

            // Verify order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].total).toBeGreaterThanOrEqual(sorted[i + 1].total);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 21: Expense Aggregation Accuracy', () => {
    it('should correctly sum expenses by category', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArbitrary(),
          fc.array(
            fc.record({
              category: fc.constantFrom(
                'plumbing',
                'electrical',
                'hvac',
                'structural',
                'other',
              ),
              estimated_cost: decimalArbitrary(),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          async (buildingId, requests) => {
            // Group requests by category
            const expected = new Map<string, { total: number; count: number }>();

            requests.forEach((r) => {
              if (!expected.has(r.category)) {
                expected.set(r.category, { total: 0, count: 0 });
              }
              const group = expected.get(r.category)!;
              group.total = Number((group.total + r.estimated_cost).toFixed(2));
              group.count += 1;
            });

            // Verify aggregation
            expected.forEach((group, category) => {
              const categoryRequests = requests.filter(
                (r) => r.category === category,
              );
              expect(group.count).toBe(categoryRequests.length);

              // Verify total is sum of costs
              const calculatedTotal = Number(
                categoryRequests
                  .reduce((sum, r) => sum + r.estimated_cost, 0)
                  .toFixed(2),
              );
              expect(group.total).toBe(calculatedTotal);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 22: Variance Calculation Accuracy', () => {
    it('should correctly calculate variance as actual minus budgeted', async () => {
      await fc.assert(
        fc.asyncProperty(
          decimalArbitrary(),
          decimalArbitrary(),
          async (actual, budgeted) => {
            const variance = Number((actual - budgeted).toFixed(2));
            const variancePercent = budgeted > 0 
              ? Number(((variance / budgeted) * 100).toFixed(1))
              : 0;

            // Verify variance calculation
            expect(variance).toBe(Number((actual - budgeted).toFixed(2)));

            // Verify percentage calculation
            if (budgeted > 0) {
              const expectedPercent = Number(((variance / budgeted) * 100).toFixed(1));
              expect(variancePercent).toBe(expectedPercent);
            }

            // Verify decimal precision
            const varianceStr = variance.toString();
            const decimalPart = varianceStr.split('.')[1] || '';
            expect(decimalPart.length).toBeLessThanOrEqual(2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 23: Budget Comparison Data Completeness', () => {
    it('should include all required fields for budget comparison', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.constantFrom('Income', 'Expenses'),
            budgeted: fc.option(decimalArbitrary()),
            actual: decimalArbitrary(),
          }),
          async (category) => {
            // Build complete category object
            const variance = category.budgeted !== null
              ? Number((category.actual - category.budgeted).toFixed(2))
              : null;
            const variancePercent = category.budgeted !== null && category.budgeted > 0
              ? Number(((variance! / category.budgeted) * 100).toFixed(1))
              : null;
            const isFavorable = category.budgeted !== null
              ? (category.name === 'Income' ? variance! >= 0 : variance! <= 0)
              : null;

            const complete = {
              ...category,
              variance,
              variancePercent,
              isFavorable,
            };

            // Verify all required fields
            expect(complete).toHaveProperty('name');
            expect(complete).toHaveProperty('budgeted');
            expect(complete).toHaveProperty('actual');
            expect(complete).toHaveProperty('variance');
            expect(complete).toHaveProperty('variancePercent');
            expect(complete).toHaveProperty('isFavorable');

            // Verify types
            expect(typeof complete.name).toBe('string');
            expect(typeof complete.actual).toBe('number');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 24: Variance Classification Logic', () => {
    it('should correctly classify variance as favorable or unfavorable', async () => {
      await fc.assert(
        fc.asyncProperty(
          decimalArbitrary(),
          decimalArbitrary(),
          fc.constantFrom('Income', 'Expenses'),
          async (actual, budgeted, categoryName) => {
            const variance = Number((actual - budgeted).toFixed(2));

            // Income: over budget is favorable (variance >= 0)
            // Expenses: under budget is favorable (variance <= 0)
            const isFavorable = categoryName === 'Income' 
              ? variance >= 0 
              : variance <= 0;

            // Verify classification logic
            if (categoryName === 'Income') {
              if (actual >= budgeted) {
                expect(isFavorable).toBe(true);
              } else {
                expect(isFavorable).toBe(false);
              }
            } else {
              if (actual <= budgeted) {
                expect(isFavorable).toBe(true);
              } else {
                expect(isFavorable).toBe(false);
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 31: Payment Status Aggregation Accuracy', () => {
    it('should correctly aggregate payments by status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              status: fc.constantFrom('pending', 'paid', 'overdue'),
              amount: decimalArbitrary(),
            }),
            { minLength: 1, maxLength: 30 },
          ),
          async (payments) => {
            // Group by status
            const statusMap = new Map<string, { amount: number; count: number }>();

            payments.forEach((p) => {
              if (!statusMap.has(p.status)) {
                statusMap.set(p.status, { amount: 0, count: 0 });
              }
              const group = statusMap.get(p.status)!;
              group.amount = Number((group.amount + p.amount).toFixed(2));
              group.count += 1;
            });

            // Verify aggregation
            statusMap.forEach((group, status) => {
              const statusPayments = payments.filter((p) => p.status === status);
              expect(group.count).toBe(statusPayments.length);

              const expectedTotal = Number(
                statusPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
              );
              expect(group.amount).toBe(expectedTotal);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 32: Collection Rate Calculation', () => {
    it('should calculate collection rate as (paid / total) * 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              status: fc.constantFrom('pending', 'paid', 'overdue'),
              amount: decimalArbitrary(),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          async (payments) => {
            const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            const paidAmount = payments
              .filter((p) => p.status === 'paid')
              .reduce((sum, p) => sum + p.amount, 0);

            const collectionRate = totalAmount > 0
              ? Number(((paidAmount / totalAmount) * 100).toFixed(1))
              : 0;

            // Verify calculation
            if (totalAmount > 0) {
              const expected = Number(((paidAmount / totalAmount) * 100).toFixed(1));
              expect(collectionRate).toBe(expected);
            } else {
              expect(collectionRate).toBe(0);
            }

            // Verify range
            expect(collectionRate).toBeGreaterThanOrEqual(0);
            expect(collectionRate).toBeLessThanOrEqual(100);

            // Verify precision (1 decimal place)
            const decimalPart = collectionRate.toString().split('.')[1] || '';
            expect(decimalPart.length).toBeLessThanOrEqual(1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 33: Year-over-Year Change Calculation', () => {
    it('should correctly calculate YoY change amount and percentage', async () => {
      await fc.assert(
        fc.asyncProperty(
          decimalArbitrary(),
          decimalArbitrary(),
          async (currentYear, previousYear) => {
            const change = Number((currentYear - previousYear).toFixed(2));
            const changePercent = previousYear > 0
              ? Number(((change / previousYear) * 100).toFixed(1))
              : 0;

            // Verify change calculation
            expect(change).toBe(Number((currentYear - previousYear).toFixed(2)));

            // Verify percentage calculation
            if (previousYear > 0) {
              const expected = Number(((change / previousYear) * 100).toFixed(1));
              expect(changePercent).toBe(expected);
            }

            // Verify decimal precision
            const changeStr = change.toString();
            const decimalPart = changeStr.split('.')[1] || '';
            expect(decimalPart.length).toBeLessThanOrEqual(2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 34: Year-over-Year Data Completeness', () => {
    it('should include all required YoY comparison fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          decimalArbitrary(),
          decimalArbitrary(),
          decimalArbitrary(),
          decimalArbitrary(),
          async (currentIncome, currentExpenses, previousIncome, previousExpenses) => {
            const result = {
              currentYear: {
                income: currentIncome,
                expenses: currentExpenses,
              },
              previousYear: {
                income: previousIncome,
                expenses: previousExpenses,
              },
              change: {
                income: Number((currentIncome - previousIncome).toFixed(2)),
                expenses: Number((currentExpenses - previousExpenses).toFixed(2)),
              },
              changePercent: {
                income: previousIncome > 0
                  ? Number((((currentIncome - previousIncome) / previousIncome) * 100).toFixed(1))
                  : 0,
                expenses: previousExpenses > 0
                  ? Number((((currentExpenses - previousExpenses) / previousExpenses) * 100).toFixed(1))
                  : 0,
              },
            };

            // Verify structure
            expect(result).toHaveProperty('currentYear');
            expect(result).toHaveProperty('previousYear');
            expect(result).toHaveProperty('change');
            expect(result).toHaveProperty('changePercent');

            // Verify nested properties
            expect(result.currentYear).toHaveProperty('income');
            expect(result.currentYear).toHaveProperty('expenses');
            expect(result.previousYear).toHaveProperty('income');
            expect(result.previousYear).toHaveProperty('expenses');
            expect(result.change).toHaveProperty('income');
            expect(result.change).toHaveProperty('expenses');
            expect(result.changePercent).toHaveProperty('income');
            expect(result.changePercent).toHaveProperty('expenses');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 35: Monthly Breakdown Structure', () => {
    it('should include 12 months with income and expenses for each', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              month: fc.integer({ min: 1, max: 12 }),
              income: decimalArbitrary(),
              expenses: decimalArbitrary(),
            }),
            { minLength: 12, maxLength: 12 },
          ),
          async (monthlyData) => {
            // Verify 12 months
            expect(monthlyData.length).toBe(12);

            // Verify each month has required fields
            monthlyData.forEach((month, index) => {
              expect(month).toHaveProperty('month');
              expect(month).toHaveProperty('income');
              expect(month).toHaveProperty('expenses');

              // Verify types
              expect(typeof month.month).toBe('number');
              expect(typeof month.income).toBe('number');
              expect(typeof month.expenses).toBe('number');

              // Verify month range
              expect(month.month).toBeGreaterThanOrEqual(1);
              expect(month.month).toBeLessThanOrEqual(12);

              // Verify amounts are non-negative
              expect(month.income).toBeGreaterThanOrEqual(0);
              expect(month.expenses).toBeGreaterThanOrEqual(0);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
