import { Test, TestingModule } from '@nestjs/testing';
import { GetIncomeReportHandler } from '../queries/handlers/get-income-report.handler';
import { GetIncomeReportQuery } from '../queries/impl/get-income-report.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetIncomeReportHandler', () => {
  let handler: GetIncomeReportHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    payments: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetIncomeReportHandler,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    handler = module.get<GetIncomeReportHandler>(GetIncomeReportHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should aggregate income by payment type', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId, '2024-01-01', '2024-01-31');

      mockPrisma.payments.findMany.mockResolvedValue([
        { payment_type: 'maintenance_fee', amount: 500 },
        { payment_type: 'maintenance_fee', amount: 500 },
        { payment_type: 'parking_fee', amount: 200 },
        { payment_type: 'parking_fee', amount: 200 },
        { payment_type: 'parking_fee', amount: 200 },
      ]);

      const result = await handler.execute(query);

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0]).toEqual({
        name: 'maintenance_fee',
        total: 1000,
        count: 2,
      });
      expect(result.categories[1]).toEqual({
        name: 'parking_fee',
        total: 600,
        count: 3,
      });
      expect(result.grandTotal).toBe(1600);
    });

    it('should sort categories by total amount DESC', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId, '2024-01-01', '2024-01-31');

      mockPrisma.payments.findMany.mockResolvedValue([
        { payment_type: 'parking_fee', amount: 100 },
        { payment_type: 'maintenance_fee', amount: 500 },
        { payment_type: 'maintenance_fee', amount: 500 },
        { payment_type: 'parking_fee', amount: 100 },
      ]);

      const result = await handler.execute(query);

      expect(result.categories[0].name).toBe('maintenance_fee');
      expect(result.categories[0].total).toBe(1000);
      expect(result.categories[1].name).toBe('parking_fee');
      expect(result.categories[1].total).toBe(200);
    });

    it('should use default date range when not provided', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId);

      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      const now = new Date();
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      expect(prisma.payments.findMany).toHaveBeenCalledWith({
        where: {
          apartments: {
            building_id: buildingId,
          },
          status: 'paid',
          paid_date: {
            gte: expectedStart,
            lte: expectedEnd,
          },
        },
        select: {
          payment_type: true,
          amount: true,
        },
      });
    });

    it('should only include paid payments', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId, '2024-01-01', '2024-01-31');

      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'paid',
        }),
        select: expect.any(Object),
      });
    });

    it('should round amounts to 2 decimal places', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId, '2024-01-01', '2024-01-31');

      mockPrisma.payments.findMany.mockResolvedValue([
        { payment_type: 'maintenance_fee', amount: 100.11 },
        { payment_type: 'maintenance_fee', amount: 200.22 },
      ]);

      const result = await handler.execute(query);

      expect(result.categories[0].total).toBe(300.33);
      expect(result.grandTotal).toBe(300.33);
    });

    it('should handle empty result set', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId, '2024-01-01', '2024-01-31');

      mockPrisma.payments.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.categories).toEqual([]);
      expect(result.grandTotal).toBe(0);
    });

    it('should handle single payment type', async () => {
      const buildingId = 'building-123';
      const query = new GetIncomeReportQuery(buildingId, '2024-01-01', '2024-01-31');

      mockPrisma.payments.findMany.mockResolvedValue([
        { payment_type: 'maintenance_fee', amount: 500 },
        { payment_type: 'maintenance_fee', amount: 500 },
        { payment_type: 'maintenance_fee', amount: 500 },
      ]);

      const result = await handler.execute(query);

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0]).toEqual({
        name: 'maintenance_fee',
        total: 1500,
        count: 3,
      });
      expect(result.grandTotal).toBe(1500);
    });
  });
});
