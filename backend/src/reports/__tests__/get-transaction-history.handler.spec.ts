import { Test, TestingModule } from '@nestjs/testing';
import { GetTransactionHistoryHandler } from '../queries/handlers/get-transaction-history.handler';
import { GetTransactionHistoryQuery } from '../queries/impl/get-transaction-history.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetTransactionHistoryHandler', () => {
  let handler: GetTransactionHistoryHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    payments: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionHistoryHandler,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    handler = module.get<GetTransactionHistoryHandler>(GetTransactionHistoryHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated transactions with default date range', async () => {
      const buildingId = 'building-123';
      const query = new GetTransactionHistoryQuery(buildingId, 1, 50);

      mockPrisma.payments.count.mockResolvedValue(25);
      mockPrisma.payments.findMany.mockResolvedValue([
        {
          id: 'payment-1',
          amount: 500.5,
          due_date: new Date('2024-01-15'),
          paid_date: new Date('2024-01-16'),
          status: 'paid',
          payment_type: 'maintenance_fee',
          description: 'Monthly maintenance',
          reference_number: 'REF-001',
          created_at: new Date('2024-01-01'),
          apartments: {
            apartment_number: '101',
            building_id: buildingId,
          },
        },
      ]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'payment-1',
        apartmentNumber: '101',
        amount: 500.5,
        dueDate: new Date('2024-01-15'),
        paidDate: new Date('2024-01-16'),
        status: 'paid',
        paymentType: 'maintenance_fee',
        description: 'Monthly maintenance',
        referenceNumber: 'REF-001',
        createdAt: new Date('2024-01-01'),
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 25,
        totalPages: 1,
      });
    });

    it('should filter by date range when provided', async () => {
      const buildingId = 'building-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const query = new GetTransactionHistoryQuery(buildingId, 1, 50, startDate, endDate);

      mockPrisma.payments.count.mockResolvedValue(10);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      });
    });

    it('should filter by transaction type when provided', async () => {
      const buildingId = 'building-123';
      const transactionType = 'maintenance_fee';
      const query = new GetTransactionHistoryQuery(
        buildingId,
        1,
        50,
        undefined,
        undefined,
        transactionType,
      );

      mockPrisma.payments.count.mockResolvedValue(5);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          payment_type: transactionType,
        }),
      });
    });

    it('should enforce maximum limit of 100 items', async () => {
      const buildingId = 'building-123';
      const query = new GetTransactionHistoryQuery(buildingId, 1, 200); // Request 200

      mockPrisma.payments.count.mockResolvedValue(200);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at 100
        }),
      );
    });

    it('should calculate correct pagination for multiple pages', async () => {
      const buildingId = 'building-123';
      const query = new GetTransactionHistoryQuery(buildingId, 2, 25);

      mockPrisma.payments.count.mockResolvedValue(75);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 25,
        total: 75,
        totalPages: 3,
      });
      expect(prisma.payments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25, // (page 2 - 1) * 25
          take: 25,
        }),
      );
    });

    it('should order transactions by created_at DESC', async () => {
      const buildingId = 'building-123';
      const query = new GetTransactionHistoryQuery(buildingId, 1, 50);

      mockPrisma.payments.count.mockResolvedValue(0);
      mockPrisma.payments.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.payments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            created_at: 'desc',
          },
        }),
      );
    });

    it('should round amounts to 2 decimal places', async () => {
      const buildingId = 'building-123';
      const query = new GetTransactionHistoryQuery(buildingId, 1, 50);

      mockPrisma.payments.count.mockResolvedValue(1);
      mockPrisma.payments.findMany.mockResolvedValue([
        {
          id: 'payment-1',
          amount: 123.456789,
          due_date: new Date('2024-01-15'),
          paid_date: null,
          status: 'pending',
          payment_type: 'maintenance_fee',
          description: 'Test',
          reference_number: 'REF-001',
          created_at: new Date('2024-01-01'),
          apartments: {
            apartment_number: '101',
            building_id: buildingId,
          },
        },
      ]);

      const result = await handler.execute(query);

      expect(result.data[0].amount).toBe(123.46);
    });
  });
});
