import { Test, TestingModule } from '@nestjs/testing';
import { GetExpenseReportHandler } from '../queries/handlers/get-expense-report.handler';
import { GetExpenseReportQuery } from '../queries/impl/get-expense-report.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetExpenseReportHandler', () => {
  let handler: GetExpenseReportHandler;

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetExpenseReportHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<GetExpenseReportHandler>(GetExpenseReportHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return empty expense report', async () => {
      const query = new GetExpenseReportQuery('bld-1', '2024-01-01', '2024-12-31');

      const result = await handler.execute();

      expect(result).toEqual({
        categories: [],
        grandTotal: 0,
      });
    });

    it('should return zero grand total', async () => {
      const query = new GetExpenseReportQuery('bld-1', '2024-01-01', '2024-12-31');

      const result = await handler.execute();

      expect(result.grandTotal).toBe(0);
    });

    it('should return empty categories array', async () => {
      const query = new GetExpenseReportQuery('bld-1', '2024-01-01', '2024-12-31');

      const result = await handler.execute();

      expect(result.categories).toEqual([]);
      expect(Array.isArray(result.categories)).toBe(true);
    });
  });
});
