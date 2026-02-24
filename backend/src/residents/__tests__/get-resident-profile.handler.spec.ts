import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetResidentProfileHandler } from '../queries/handlers/get-resident-profile.handler';
import { GetResidentProfileQuery } from '../queries/impl/get-resident-profile.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetResidentProfileHandler', () => {
  let handler: GetResidentProfileHandler;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user_profiles: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetResidentProfileHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    handler = module.get<GetResidentProfileHandler>(GetResidentProfileHandler);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return complete resident profile with all associations', async () => {
      const residentId = 'user-1';
      const query = new GetResidentProfileQuery(residentId);

      const mockUserProfile = {
        id: 'user-1',
        full_name: 'Alice Smith',
        phone_number: '1234567890',
        user_type: 'RESIDENT',
        preferred_language: 'en',
        building_committee_members: [
          {
            building_id: 'building-1',
            role: 'PRESIDENT',
            created_at: new Date('2024-01-01'),
            buildings: {
              id: 'building-1',
              name: 'Sunset Towers',
              address_line: '123 Main St',
            },
          },
        ],
        apartment_owners: [
          {
            apartments: {
              id: 'apt-1',
              apartment_number: '101',
              building_id: 'building-1',
              buildings: {
                name: 'Sunset Towers',
                address_line: '123 Main St',
              },
            },
            ownership_share: 100,
            is_primary: true,
            created_at: new Date('2024-01-01'),
          },
        ],
        apartment_tenants: [],
      };

      mockPrismaService.user_profiles.findUnique.mockResolvedValue(mockUserProfile);

      const result = await handler.execute(query);

      expect(result.id).toBe('user-1');
      expect(result.full_name).toBe('Alice Smith');
      expect(result.phone_number).toBe('1234567890');
      expect(result.user_type).toBe('RESIDENT');
      expect(result.preferred_language).toBe('en');
      expect(result.committee_roles).toHaveLength(1);
      expect(result.committee_roles[0].building_name).toBe('Sunset Towers');
      expect(result.committee_roles[0].role).toBe('PRESIDENT');
      expect(result.apartment_owners).toHaveLength(1);
      expect(result.apartment_owners[0].apartment_number).toBe('101');
      expect(result.apartment_owners[0].ownership_share).toBe(100);
      expect(result.apartment_tenants).toHaveLength(0);
    });

    it('should return profile with tenant associations', async () => {
      const residentId = 'user-2';
      const query = new GetResidentProfileQuery(residentId);

      const mockUserProfile = {
        id: 'user-2',
        full_name: 'Bob Johnson',
        phone_number: '0987654321',
        user_type: 'RESIDENT',
        preferred_language: 'en',
        building_committee_members: [],
        apartment_owners: [],
        apartment_tenants: [
          {
            apartments: {
              id: 'apt-2',
              apartment_number: '202',
              building_id: 'building-1',
              buildings: {
                name: 'Sunset Towers',
                address_line: '123 Main St',
              },
            },
            move_in_date: new Date('2024-06-01'),
            is_active: true,
          },
        ],
      };

      mockPrismaService.user_profiles.findUnique.mockResolvedValue(mockUserProfile);

      const result = await handler.execute(query);

      expect(result.id).toBe('user-2');
      expect(result.apartment_tenants).toHaveLength(1);
      expect(result.apartment_tenants[0].apartment_number).toBe('202');
      expect(result.apartment_tenants[0].is_active).toBe(true);
      expect(result.committee_roles).toHaveLength(0);
      expect(result.apartment_owners).toHaveLength(0);
    });

    it('should return profile with multiple building associations', async () => {
      const residentId = 'user-3';
      const query = new GetResidentProfileQuery(residentId);

      const mockUserProfile = {
        id: 'user-3',
        full_name: 'Charlie Brown',
        phone_number: '5555555555',
        user_type: 'RESIDENT',
        preferred_language: 'en',
        building_committee_members: [
          {
            building_id: 'building-1',
            role: 'TREASURER',
            created_at: new Date('2024-01-01'),
            buildings: {
              id: 'building-1',
              name: 'Sunset Towers',
              address_line: '123 Main St',
            },
          },
          {
            building_id: 'building-2',
            role: 'SECRETARY',
            created_at: new Date('2024-02-01'),
            buildings: {
              id: 'building-2',
              name: 'Ocean View',
              address_line: '456 Beach Rd',
            },
          },
        ],
        apartment_owners: [
          {
            apartments: {
              id: 'apt-3',
              apartment_number: '301',
              building_id: 'building-1',
              buildings: {
                name: 'Sunset Towers',
                address_line: '123 Main St',
              },
            },
            ownership_share: 50,
            is_primary: true,
            created_at: new Date('2024-01-01'),
          },
          {
            apartments: {
              id: 'apt-4',
              apartment_number: '102',
              building_id: 'building-2',
              buildings: {
                name: 'Ocean View',
                address_line: '456 Beach Rd',
              },
            },
            ownership_share: 100,
            is_primary: false,
            created_at: new Date('2024-02-01'),
          },
        ],
        apartment_tenants: [],
      };

      mockPrismaService.user_profiles.findUnique.mockResolvedValue(mockUserProfile);

      const result = await handler.execute(query);

      expect(result.committee_roles).toHaveLength(2);
      expect(result.apartment_owners).toHaveLength(2);
      expect(result.committee_roles[0].building_name).toBe('Sunset Towers');
      expect(result.committee_roles[1].building_name).toBe('Ocean View');
    });

    it('should throw NotFoundException when resident does not exist', async () => {
      const residentId = 'non-existent-user';
      const query = new GetResidentProfileQuery(residentId);

      mockPrismaService.user_profiles.findUnique.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('Resident not found');
    });

    it('should return profile with no associations', async () => {
      const residentId = 'user-4';
      const query = new GetResidentProfileQuery(residentId);

      const mockUserProfile = {
        id: 'user-4',
        full_name: 'Diana Prince',
        phone_number: '7777777777',
        user_type: 'RESIDENT',
        preferred_language: 'en',
        building_committee_members: [],
        apartment_owners: [],
        apartment_tenants: [],
      };

      mockPrismaService.user_profiles.findUnique.mockResolvedValue(mockUserProfile);

      const result = await handler.execute(query);

      expect(result.id).toBe('user-4');
      expect(result.full_name).toBe('Diana Prince');
      expect(result.committee_roles).toHaveLength(0);
      expect(result.apartment_owners).toHaveLength(0);
      expect(result.apartment_tenants).toHaveLength(0);
    });

    it('should include all required profile fields', async () => {
      const residentId = 'user-5';
      const query = new GetResidentProfileQuery(residentId);

      const mockUserProfile = {
        id: 'user-5',
        full_name: 'Eve Adams',
        phone_number: '8888888888',
        user_type: 'RESIDENT',
        preferred_language: 'es',
        building_committee_members: [],
        apartment_owners: [],
        apartment_tenants: [],
      };

      mockPrismaService.user_profiles.findUnique.mockResolvedValue(mockUserProfile);

      const result = await handler.execute(query);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('full_name');
      expect(result).toHaveProperty('phone_number');
      expect(result).toHaveProperty('user_type');
      expect(result).toHaveProperty('preferred_language');
      expect(result).toHaveProperty('committee_roles');
      expect(result).toHaveProperty('apartment_owners');
      expect(result).toHaveProperty('apartment_tenants');
    });
  });
});
