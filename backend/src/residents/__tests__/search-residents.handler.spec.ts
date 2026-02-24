import { Test, TestingModule } from '@nestjs/testing';
import { SearchResidentsHandler } from '../queries/handlers/search-residents.handler';
import { SearchResidentsQuery } from '../queries/impl/search-residents.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('SearchResidentsHandler', () => {
  let handler: SearchResidentsHandler;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user_profiles: {
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
        SearchResidentsHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    handler = module.get<SearchResidentsHandler>(SearchResidentsHandler);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should search residents by name', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, 'alice', 'name');

      const mockUsers = [
        {
          id: 'user-1',
          full_name: 'Alice Smith',
          phone_number: '1234567890',
          user_type: 'RESIDENT',
        },
        {
          id: 'user-2',
          full_name: 'Alice Johnson',
          phone_number: '0987654321',
          user_type: 'RESIDENT',
        },
      ];

      mockPrismaService.user_profiles.findMany.mockResolvedValue(mockUsers);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].full_name).toContain('Alice');
      expect(result.data[1].full_name).toContain('Alice');
      expect(mockPrismaService.user_profiles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            full_name: {
              contains: 'alice',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('should search residents by phone number', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, '1234', 'phone');

      const mockUsers = [
        {
          id: 'user-1',
          full_name: 'Alice Smith',
          phone_number: '1234567890',
          user_type: 'RESIDENT',
        },
      ];

      mockPrismaService.user_profiles.findMany.mockResolvedValue(mockUsers);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].phone_number).toContain('1234');
      expect(mockPrismaService.user_profiles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone_number: {
              contains: '1234',
            },
          }),
        }),
      );
    });

    it('should search residents by apartment number', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, '101', 'apartment');

      const mockOwners = [
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
          },
        },
      ];

      const mockTenants = [
        {
          user_profiles: {
            id: 'user-2',
            full_name: 'Bob Johnson',
            phone_number: '0987654321',
            user_type: 'RESIDENT',
          },
        },
      ];

      mockPrismaService.apartment_owners.findMany.mockResolvedValue(mockOwners);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue(mockTenants);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaService.apartment_owners.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            apartments: expect.objectContaining({
              building_id: buildingId,
              apartment_number: '101',
            }),
          }),
        }),
      );
    });

    it('should deduplicate residents when searching by apartment', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, '101', 'apartment');

      const mockOwners = [
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
          },
        },
      ];

      const mockTenants = [
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
          },
        },
      ];

      mockPrismaService.apartment_owners.findMany.mockResolvedValue(mockOwners);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue(mockTenants);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('user-1');
    });

    it('should sort results alphabetically by full_name', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, 'smith', 'name');

      const mockUsers = [
        {
          id: 'user-1',
          full_name: 'Zoe Smith',
          phone_number: '1111111111',
          user_type: 'RESIDENT',
        },
        {
          id: 'user-2',
          full_name: 'Alice Smith',
          phone_number: '2222222222',
          user_type: 'RESIDENT',
        },
        {
          id: 'user-3',
          full_name: 'Bob Smith',
          phone_number: '3333333333',
          user_type: 'RESIDENT',
        },
      ];

      mockPrismaService.user_profiles.findMany.mockResolvedValue(mockUsers);

      const result = await handler.execute(query);

      expect(result.data[0].full_name).toBe('Alice Smith');
      expect(result.data[1].full_name).toBe('Bob Smith');
      expect(result.data[2].full_name).toBe('Zoe Smith');
    });

    it('should return empty array when no matches found', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, 'nonexistent', 'name');

      mockPrismaService.user_profiles.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle case-insensitive name search', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, 'ALICE', 'name');

      const mockUsers = [
        {
          id: 'user-1',
          full_name: 'alice smith',
          phone_number: '1234567890',
          user_type: 'RESIDENT',
        },
      ];

      mockPrismaService.user_profiles.findMany.mockResolvedValue(mockUsers);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.user_profiles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            full_name: expect.objectContaining({
              mode: 'insensitive',
            }),
          }),
        }),
      );
    });

    it('should filter by building when searching by name', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, 'alice', 'name');

      mockPrismaService.user_profiles.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(mockPrismaService.user_profiles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                building_committee_members: expect.objectContaining({
                  some: expect.objectContaining({
                    building_id: buildingId,
                  }),
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should only return active tenants when searching by apartment', async () => {
      const buildingId = 'building-1';
      const query = new SearchResidentsQuery(buildingId, '101', 'apartment');

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(mockPrismaService.apartment_tenants.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
          }),
        }),
      );
    });
  });
});
