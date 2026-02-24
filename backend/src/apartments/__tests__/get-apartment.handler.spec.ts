import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetApartmentHandler } from '../queries/handlers/get-apartment.handler';
import { GetApartmentQuery } from '../queries/impl/get-apartment.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetApartmentHandler', () => {
  let handler: GetApartmentHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    apartments: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetApartmentHandler,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    handler = module.get<GetApartmentHandler>(GetApartmentHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return apartment with owners and tenants', async () => {
      const query = new GetApartmentQuery('apartment-123');

      const mockApartment = {
        id: 'apartment-123',
        building_id: 'building-123',
        apartment_number: '101',
        area_sqm: 75.5,
        floor: 1,
        is_vacant: false,
        buildings: {
          id: 'building-123',
          name: 'Building A',
        },
        apartment_owners: [
          {
            id: 'owner-1',
            user_id: 'user-123',
            ownership_share: 100,
            is_primary: true,
            user_profiles: {
              id: 'user-123',
              full_name: 'John Doe',
              phone_number: '+1234567890',
              user_type: 'owner',
            },
          },
        ],
        apartment_tenants: [
          {
            id: 'tenant-1',
            user_id: 'user-456',
            is_active: true,
            move_in_date: new Date('2024-01-01'),
            user_profiles: {
              id: 'user-456',
              full_name: 'Jane Smith',
              phone_number: '+0987654321',
              user_type: 'tenant',
            },
          },
        ],
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);

      const result = await handler.execute(query);

      expect(result).toEqual(mockApartment);
      expect(result.apartment_owners).toHaveLength(1);
      expect(result.apartment_tenants).toHaveLength(1);
      expect(prisma.apartments.findUnique).toHaveBeenCalledWith({
        where: { id: 'apartment-123' },
        include: {
          buildings: true,
          apartment_owners: {
            include: {
              user_profiles: {
                select: {
                  id: true,
                  full_name: true,
                  phone_number: true,
                  user_type: true,
                },
              },
            },
          },
          apartment_tenants: {
            where: { is_active: true },
            include: {
              user_profiles: {
                select: {
                  id: true,
                  full_name: true,
                  phone_number: true,
                  user_type: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException when apartment does not exist', async () => {
      const query = new GetApartmentQuery('nonexistent-apartment');

      mockPrisma.apartments.findUnique.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('Apartment not found');
    });

    it('should return apartment with no owners or tenants', async () => {
      const query = new GetApartmentQuery('apartment-123');

      const mockApartment = {
        id: 'apartment-123',
        building_id: 'building-123',
        apartment_number: '102',
        area_sqm: 80.0,
        floor: 2,
        is_vacant: true,
        buildings: {
          id: 'building-123',
          name: 'Building A',
        },
        apartment_owners: [],
        apartment_tenants: [],
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);

      const result = await handler.execute(query);

      expect(result.is_vacant).toBe(true);
      expect(result.apartment_owners).toHaveLength(0);
      expect(result.apartment_tenants).toHaveLength(0);
    });

    it('should only include active tenants', async () => {
      const query = new GetApartmentQuery('apartment-123');

      const mockApartment = {
        id: 'apartment-123',
        apartment_tenants: [
          {
            id: 'tenant-1',
            user_id: 'user-456',
            is_active: true,
            user_profiles: {
              id: 'user-456',
              full_name: 'Active Tenant',
            },
          },
        ],
        apartment_owners: [],
        buildings: {},
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);

      const result = await handler.execute(query);

      expect(result.apartment_tenants).toHaveLength(1);
      expect(result.apartment_tenants[0].is_active).toBe(true);
      expect(prisma.apartments.findUnique).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.objectContaining({
          apartment_tenants: {
            where: { is_active: true },
            include: expect.any(Object),
          },
        }),
      });
    });

    it('should include building information', async () => {
      const query = new GetApartmentQuery('apartment-123');

      const mockApartment = {
        id: 'apartment-123',
        buildings: {
          id: 'building-123',
          name: 'Sunset Towers',
          address: '123 Main St',
        },
        apartment_owners: [],
        apartment_tenants: [],
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);

      const result = await handler.execute(query);

      expect(result.buildings).toBeDefined();
      expect(result.buildings.name).toBe('Sunset Towers');
    });

    it('should include user profile information for owners', async () => {
      const query = new GetApartmentQuery('apartment-123');

      const mockApartment = {
        id: 'apartment-123',
        apartment_owners: [
          {
            id: 'owner-1',
            user_profiles: {
              id: 'user-123',
              full_name: 'John Doe',
              phone_number: '+1234567890',
              user_type: 'owner',
            },
          },
        ],
        apartment_tenants: [],
        buildings: {},
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);

      const result = await handler.execute(query);

      expect(result.apartment_owners[0].user_profiles).toBeDefined();
      expect(result.apartment_owners[0].user_profiles.full_name).toBe('John Doe');
      expect(result.apartment_owners[0].user_profiles.phone_number).toBe('+1234567890');
    });

    it('should handle multiple owners with different ownership shares', async () => {
      const query = new GetApartmentQuery('apartment-123');

      const mockApartment = {
        id: 'apartment-123',
        apartment_owners: [
          {
            id: 'owner-1',
            user_id: 'user-123',
            ownership_share: 60,
            is_primary: true,
            user_profiles: {
              id: 'user-123',
              full_name: 'Primary Owner',
            },
          },
          {
            id: 'owner-2',
            user_id: 'user-456',
            ownership_share: 40,
            is_primary: false,
            user_profiles: {
              id: 'user-456',
              full_name: 'Secondary Owner',
            },
          },
        ],
        apartment_tenants: [],
        buildings: {},
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);

      const result = await handler.execute(query);

      expect(result.apartment_owners).toHaveLength(2);
      expect(result.apartment_owners[0].is_primary).toBe(true);
      expect(result.apartment_owners[1].is_primary).toBe(false);
    });
  });
});
