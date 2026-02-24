import { Test, TestingModule } from '@nestjs/testing';
import { GetBuildingBalanceHandler } from '../queries/handlers/get-building-balance.handler';
import { GetBuildingBalanceQuery } from '../queries/impl/get-building-balance.query';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';

describe('GetBuildingBalanceHandler', () => {
  let handler: GetBuildingBalanceHandler;
  let prisma: PrismaService;
  let cache: CacheService;

  const mockPrisma = {
    payments: {
      aggregate: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBuildingBalanceHandler,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    handler = module.get<GetBuildingBalanceHandler>(GetBuildingBalanceHandler);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return cached balance if available', async () => {
      const buildingId = 'building-123';
      const cachedResult = JSON.stringify({
        balance: 10000,
        lastUpdated: '2024-01-15T10:00:00.000Z',
      });
      mockCache.get.mockResolvedValue(cachedResult);

      const result = await handler.execute(new GetBuildingBalanceQuery(buildingId));

      expect(cache.get).toHaveBeenCalledWith(`balance:${buildingId}`);
      expect(prisma.payments.aggregate).not.toHaveBeenCalled();
      expect(result).toEqual({
        balance: 10000,
        lastUpdated: '2024-01-15T10:00:00.000Z',
      });
    });

    it('should calculate balance from database when cache miss', async () => {
      const buildingId = 'building-123';
      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: {
          amount: 15000.5,
        },
      });

      const result = await handler.execute(new GetBuildingBalanceQuery(buildingId));

      expect(cache.get).toHaveBeenCalledWith(`balance:${buildingId}`);
      expect(prisma.payments.aggregate).toHaveBeenCalledWith({
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
      expect(result.balance).toBe(15000.5);
      expect(result.lastUpdated).toBeDefined();
      expect(cache.set).toHaveBeenCalledWith(
        `balance:${buildingId}`,
        expect.any(String),
        300, // 5 minutes TTL
      );
    });

    it('should handle zero balance correctly', async () => {
      const buildingId = 'building-123';
      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: {
          amount: null, // No payments
        },
      });

      const result = await handler.execute(new GetBuildingBalanceQuery(buildingId));

      expect(result.balance).toBe(0);
      expect(result.lastUpdated).toBeDefined();
    });

    it('should round balance to 2 decimal places', async () => {
      const buildingId = 'building-123';
      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: {
          amount: 12345.6789,
        },
      });

      const result = await handler.execute(new GetBuildingBalanceQuery(buildingId));

      expect(result.balance).toBe(12345.68);
    });

    it('should cache the calculated result', async () => {
      const buildingId = 'building-123';
      mockCache.get.mockResolvedValue(null);
      mockPrisma.payments.aggregate.mockResolvedValue({
        _sum: {
          amount: 10000,
        },
      });

      await handler.execute(new GetBuildingBalanceQuery(buildingId));

      expect(cache.set).toHaveBeenCalledWith(
        `balance:${buildingId}`,
        expect.stringContaining('"balance":10000'),
        300,
      );
    });
  });
});
