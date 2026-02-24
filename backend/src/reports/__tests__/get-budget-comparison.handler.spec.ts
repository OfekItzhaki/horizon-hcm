import { Test, TestingModule } from '@nestjs/testing';
import { GetBudgetComparisonHandler } from '../queries/handlers/get-budget-comparison.handler';
import { GetBudgetComparisonQuery } from '../queries/impl/get-budget-comparison.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetBudgetComparisonHandler', () => {
  let handler: GetBudgetComparisonHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    payments: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBudgetComparisonHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<GetBudgetComparisonHandler>(GetBudgetComparisonHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return budget comparison with income and expenses', async () => {
      const query = new GetBudgetComparisonQuery(
        'bld-1',
        '2024-01-01',
        '2024-12-31',
      );

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
      });

      const result = await handler.execute(query);

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('Income');
      expect(result.categories[1].name).toBe('Expenses');
    });

    it('should calculate actual income from paid payments', async () => {
      const query = new GetBudgetComparisonQuery(
        'bld-1',
        '2024-01-01',
        '2024-12-31',
      );

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: 75000.50 },
      });

      const result = await handler.execute(query);

      expect(result.categories[0].actual).toBe(75000.50);
    });

    it('should handle null budget configuration', async () => {
      const query = new GetBudgetComparisonQuery(
        'bld-1',
        '2024-01-01',
        '2024-12-31',
      );

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
      });

      const result = await handler.execute(query);

      expect(result.categories[0].budgeted).toBeNull();
      expect(result.categories[0].variance).toBeNull();
      expect(result.categories[0].variancePercent).toBeNull();
      expect(result.categories[0].isFavorable).toBeNull();
    });

    it('should set expenses to zero when not tracked', async () => {
      const query = new GetBudgetComparisonQuery(
        'bld-1',
        '2024-01-01',
        '2024-12-31',
      );

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
      });

      const result = await handler.execute(query);

      expect(result.categories[1].actual).toBe(0);
    });

    it('should filter payments by building and date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const query = new GetBudgetComparisonQuery('bld-1', startDate, endDate);

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
      });

      await handler.execute(query);

      expect(prisma.payments.aggregate).toHaveBeenCalledWith({
        where: {
          apartments: { building_id: 'bld-1' },
          status: 'paid',
          paid_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        _sum: { amount: true },
      });
    });

    it('should handle zero income', async () => {
      const query = new GetBudgetComparisonQuery(
        'bld-1',
        '2024-01-01',
        '2024-12-31',
      );

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await handler.execute(query);

      expect(result.categories[0].actual).toBe(0);
    });

    it('should return two categories (Income and Expenses)', async () => {
      const query = new GetBudgetComparisonQuery(
        'bld-1',
        '2024-01-01',
        '2024-12-31',
      );

      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
      });

      const result = await handler.execute(query);

      expect(result.categories).toHaveLength(2);
      expect(result.categories.map(c => c.name)).toEqual(['Income', 'Expenses']);
    });
  });
});
