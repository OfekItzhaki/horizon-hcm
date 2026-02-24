import { Test, TestingModule } from '@nestjs/testing';
import { ListResidentsHandler } from '../queries/handlers/list-residents.handler';
import { ListResidentsQuery } from '../queries/impl/list-residents.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('ListResidentsHandler', () => {
  let handler: ListResidentsHandler;
  let prismaService: PrismaService;

  const mockPrismaService = {
    building_committee_members: {
      findMany: jest.fn(),
    },
    apartment_owners: {
      findMany: jest.fn(),
    },
    apartment_tenants: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListResidentsHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    handler = module.get<ListResidentsHandler>(ListResidentsHandler);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should list all residents with pagination', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 10);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
            apartment_owners: [],
          },
          role: 'PRESIDENT',
        },
      ]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Bob Johnson',
            phone_number: '0987654321',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-3',
            full_name: 'Charlie Brown',
            phone_number: '5555555555',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '102',
          },
        },
      ]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(3);
      expect(result.data[0].full_name).toBe('Alice Smith');
      expect(result.data[0].roles).toContainEqual({ type: 'COMMITTEE', role: 'PRESIDENT' });
    });

    it('should enforce maximum limit of 100', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 200);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_owners.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.pagination.limit).toBe(100);
    });

    it('should filter by search term', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 10, 'alice');

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
            apartment_owners: [],
          },
          role: 'PRESIDENT',
        },
      ]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Bob Johnson',
            phone_number: '0987654321',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].full_name).toBe('Alice Smith');
    });

    it('should filter by user type', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 10, null, 'COMMITTEE');

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
            apartment_owners: [],
          },
          role: 'PRESIDENT',
        },
      ]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Bob Johnson',
            phone_number: '0987654321',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].roles).toContainEqual({ type: 'COMMITTEE', role: 'PRESIDENT' });
    });

    it('should filter by apartment number', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 10, null, null, '101');

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Bob Johnson',
            phone_number: '0987654321',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].apartments).toContainEqual({
        apartment_number: '101',
        relationship: 'OWNER',
      });
    });

    it('should sort residents alphabetically by full_name', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 10);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Zoe Adams',
            phone_number: '1111111111',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Alice Brown',
            phone_number: '2222222222',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '102',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data[0].full_name).toBe('Alice Brown');
      expect(result.data[1].full_name).toBe('Zoe Adams');
    });

    it('should deduplicate residents with multiple roles', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 1, 10);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
            apartment_owners: [
              {
                apartments: {
                  apartment_number: '101',
                },
              },
            ],
          },
          role: 'PRESIDENT',
        },
      ]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].roles).toContainEqual({ type: 'COMMITTEE', role: 'PRESIDENT' });
      expect(result.data[0].apartments).toContainEqual({
        apartment_number: '101',
        relationship: 'OWNER',
      });
    });

    it('should handle pagination correctly', async () => {
      const buildingId = 'building-1';
      const query = new ListResidentsQuery(buildingId, 2, 2);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Brown',
            phone_number: '1111111111',
            user_type: 'RESIDENT',
          },
          apartments: { apartment_number: '101' },
        },
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Bob Smith',
            phone_number: '2222222222',
            user_type: 'RESIDENT',
          },
          apartments: { apartment_number: '102' },
        },
        {
          user_profiles: {
            id: 'user-3',
            full_name: 'Charlie Davis',
            phone_number: '3333333333',
            user_type: 'RESIDENT',
          },
          apartments: { apartment_number: '103' },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].full_name).toBe('Charlie Davis');
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });
});
