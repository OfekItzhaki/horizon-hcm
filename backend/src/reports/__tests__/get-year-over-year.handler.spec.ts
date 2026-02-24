import { Test, TestingModule } from '@nestjs/testing';
import { GetYearOverYearHandler } from '../queries/handlers/get-year-over-year.handler';
import { GetYearOverYearQuery } from '../queries/impl/get-year-over-year.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetYearOverYearHandler', () => {
  let handler: GetYearOverYearHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    payments: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetYearOverYearHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<GetYearOverYearHandler>(GetYearOverYearHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return year-over-year comparison', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }) // Current year
        .mockResolvedValueOnce({ _sum: { amount: 80000 } }) // Previous year
        .mockResolvedValue({ _sum: { amount: 8333.33 } }); // Monthly

      const result = await handler.execute(query);

      expect(result.currentYear.income).toBe(100000);
      expect(result.previousYear.income).toBe(80000);
      expect(result.change.income).toBe(20000);
      expect(result.changePercent.income).toBe(25.0);
    });

    it('should calculate income change correctly', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 120000 } })
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValue({ _sum: { amount: 10000 } });

      const result = await handler.execute(query);

      expect(result.change.income).toBe(20000);
      expect(result.changePercent.income).toBe(20.0);
    });

    it('should handle negative income change', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 80000 } })
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValue({ _sum: { amount: 6666.67 } });

      const result = await handler.execute(query);

      expect(result.change.income).toBe(-20000);
      expect(result.changePercent.income).toBe(-20.0);
    });

    it('should use current year when year not provided', async () => {
      const query = new GetYearOverYearQuery('bld-1');
      const currentYear = new Date().getFullYear();

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: 90000 } })
        .mockResolvedValue({ _sum: { amount: 8333.33 } });

      await handler.execute(query);

      expect(prisma.payments.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paid_date: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31),
            },
          }),
        }),
      );
    });

    it('should generate monthly breakdown for 12 months', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: 90000 } })
        .mockResolvedValue({ _sum: { amount: 8333.33 } });

      const result = await handler.execute(query);

      expect(result.monthlyBreakdown).toHaveLength(12);
      expect(result.monthlyBreakdown[0].month).toBe(1);
      expect(result.monthlyBreakdown[11].month).toBe(12);
    });

    it('should set expenses to zero when not tracked', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: 90000 } })
        .mockResolvedValue({ _sum: { amount: 8333.33 } });

      const result = await handler.execute(query);

      expect(result.currentYear.expenses).toBe(0);
      expect(result.previousYear.expenses).toBe(0);
      expect(result.change.expenses).toBe(0);
      expect(result.changePercent.expenses).toBe(0);
    });

    it('should handle zero previous year income', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValue({ _sum: { amount: 8333.33 } });

      const result = await handler.execute(query);

      expect(result.previousYear.income).toBe(0);
      expect(result.changePercent.income).toBe(0);
    });

    it('should filter payments by building and year', async () => {
      const query = new GetYearOverYearQuery('bld-123', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: 90000 } })
        .mockResolvedValue({ _sum: { amount: 8333.33 } });

      await handler.execute(query);

      expect(prisma.payments.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            apartments: { building_id: 'bld-123' },
            status: 'paid',
          }),
        }),
      );
    });

    it('should include monthly income in breakdown', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: 90000 } })
        .mockResolvedValue({ _sum: { amount: 5000 } });

      const result = await handler.execute(query);

      result.monthlyBreakdown.forEach((month) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('income');
        expect(month).toHaveProperty('expenses');
        expect(month.income).toBe(5000);
        expect(month.expenses).toBe(0);
      });
    });

    it('should handle null income amounts', async () => {
      const query = new GetYearOverYearQuery('bld-1', 2024);

      mockPrisma.payments.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValue({ _sum: { amount: null } });

      const result = await handler.execute(query);

      expect(result.currentYear.income).toBe(0);
      expect(result.previousYear.income).toBe(0);
      expect(result.change.income).toBe(0);
    });
  });
});
