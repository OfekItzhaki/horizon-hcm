import { Test, TestingModule } from '@nestjs/testing';
import { GetPaymentStatusSummaryHandler } from '../queries/handlers/get-payment-status-summary.handler';
import { GetPaymentStatusSummaryQuery } from '../queries/impl/get-payment-status-summary.query';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';

describe('GetPaymentStatusSummaryHandler', () => {
  let handler: GetPaymentStatusSummaryHandler;
  let prisma: PrismaService;
  let cache: CacheService;

  const mockPrisma = {
    payments: {
      findMany: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentStatusSummaryHandler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    handler = module.get<GetPaymentStatusSummaryHandler>(GetPaymentStatusSummaryHandler);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return payment status summary', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-1',
        '2024-01-01',
        '2024-01-31',
      );

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([
        { status: 'paid', amount: 1000 },
        { status: 'pending', amount: 500 },
        { status: 'overdue', amount: 300 },
      ]);

      const result = await handler.execute(query);

      expect(result.paid).toEqual({ amount: 1000, count: 1 });
      expect(result.pending).toEqual({ amount: 500, count: 1 });
      expect(result.overdue).toEqual({ amount: 300, count: 1 });
    });

    it('should calculate collection rate correctly', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-1',
        '2024-01-01',
        '2024-01-31',
      );

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([
        { status: 'paid', amount: 800 },
        { status: 'pending', amount: 200 },
      ]);

      const result = await handler.execute(query);

      expect(result.collectionRate).toBe(80.0); // 800 / 1000 * 100
    });

    it('should return cached result if available', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-1',
        '2024-01-01',
        '2024-01-31',
      );

      const cachedResult = {
        paid: { amount: 1000, count: 1 },
        pending: { amount: 500, count: 1 },
        overdue: { amount: 0, count: 0 },
        collectionRate: 66.7,
      };

      mockCache.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await handler.execute(query);

      expect(result).toEqual(cachedResult);
      expect(prisma.payments.findMany).not.toHaveBeenCalled();
    });

    it('should cache result for 10 minutes', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-1',
        '2024-01-01',
        '2024-01-31',
      );

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([
        { status: 'paid', amount: 1000 },
      ]);

      await handler.execute(query);

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('payment-summary:bld-1:'),
        expect.any(String),
        600,
      );
    });

    it('should use default date range when not provided', async () => {
      const query = new GetPaymentStatusSummaryQuery('bld-1');

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.findMany).toHaveBeenCalledWith({
        where: {
          apartments: { building_id: 'bld-1' },
          due_date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        select: {
          status: true,
          amount: true,
        },
      });
    });

    it('should handle zero payments', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-1',
        '2024-01-01',
        '2024-01-31',
      );

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.paid).toEqual({ amount: 0, count: 0 });
      expect(result.pending).toEqual({ amount: 0, count: 0 });
      expect(result.overdue).toEqual({ amount: 0, count: 0 });
      expect(result.collectionRate).toBe(0);
    });

    it('should group multiple payments by status', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-1',
        '2024-01-01',
        '2024-01-31',
      );

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([
        { status: 'paid', amount: 1000 },
        { status: 'paid', amount: 500 },
        { status: 'pending', amount: 300 },
        { status: 'pending', amount: 200 },
      ]);

      const result = await handler.execute(query);

      expect(result.paid).toEqual({ amount: 1500, count: 2 });
      expect(result.pending).toEqual({ amount: 500, count: 2 });
    });

    it('should filter by building ID and date range', async () => {
      const query = new GetPaymentStatusSummaryQuery(
        'bld-123',
        '2024-06-01',
        '2024-06-30',
      );

      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.findMany).toHaveBeenCalledWith({
        where: {
          apartments: { building_id: 'bld-123' },
          due_date: {
            gte: new Date('2024-06-01'),
            lte: new Date('2024-06-30'),
          },
        },
        select: {
          status: true,
          amount: true,
        },
      });
    });
  });
});
