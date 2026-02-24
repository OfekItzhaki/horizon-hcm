import { Test, TestingModule } from '@nestjs/testing';
import { ListApartmentsHandler } from '../queries/handlers/list-apartments.handler';
import { ListApartmentsQuery } from '../queries/impl/list-apartments.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('ListApartmentsHandler', () => {
  let handler: ListApartmentsHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    apartments: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListApartmentsHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<ListApartmentsHandler>(ListApartmentsHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should list apartments with pagination', async () => {
      const query = new ListApartmentsQuery('bld-1', 1, 10, undefined);
      const mockApartments = [
        { id: 'apt-1', building_id: 'bld-1', apartment_number: '101', apartment_owners: [], apartment_tenants: [] },
        { id: 'apt-2', building_id: 'bld-1', apartment_number: '102', apartment_owners: [], apartment_tenants: [] },
      ];

      mockPrisma.apartments.findMany.mockResolvedValue(mockApartments);
      mockPrisma.apartments.count.mockResolvedValue(25);

      const result = await handler.execute(query);

      expect(result).toEqual({
        data: mockApartments,
        meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
      });
    });

    it('should filter by vacancy status', async () => {
      const query = new ListApartmentsQuery('bld-1', 1, 10, true);
      mockPrisma.apartments.findMany.mockResolvedValue([]);
      mockPrisma.apartments.count.mockResolvedValue(5);

      await handler.execute(query);

      expect(prisma.apartments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { building_id: 'bld-1', is_vacant: true },
        }),
      );
    });

    it('should order apartments by apartment number', async () => {
      const query = new ListApartmentsQuery('bld-1', 1, 10, undefined);
      mockPrisma.apartments.findMany.mockResolvedValue([]);
      mockPrisma.apartments.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(prisma.apartments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { apartment_number: 'asc' },
        }),
      );
    });

    it('should calculate total pages correctly', async () => {
      const query = new ListApartmentsQuery('bld-1', 1, 10, undefined);
      mockPrisma.apartments.findMany.mockResolvedValue([]);
      mockPrisma.apartments.count.mockResolvedValue(23);

      const result = await handler.execute(query);

      expect(result.meta.totalPages).toBe(3);
    });
  });
});
