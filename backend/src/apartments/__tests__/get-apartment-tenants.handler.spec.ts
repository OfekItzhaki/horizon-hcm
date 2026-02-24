import { Test, TestingModule } from '@nestjs/testing';
import { GetApartmentTenantsHandler } from '../queries/handlers/get-apartment-tenants.handler';
import { GetApartmentTenantsQuery } from '../queries/impl/get-apartment-tenants.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetApartmentTenantsHandler', () => {
  let handler: GetApartmentTenantsHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    apartment_tenants: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetApartmentTenantsHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<GetApartmentTenantsHandler>(GetApartmentTenantsHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should retrieve apartment tenants', async () => {
      const query = new GetApartmentTenantsQuery('apt-1');
      const mockTenants = [
        {
          id: 'tenant-1',
          apartment_id: 'apt-1',
          user_id: 'user-1',
          move_in_date: new Date('2024-01-01'),
          is_active: true,
          user_profiles: { id: 'profile-1', user_id: 'user-1', full_name: 'John Tenant', phone_number: '+1234567890', user_type: 'TENANT' },
        },
      ];

      mockPrisma.apartment_tenants.findMany.mockResolvedValue(mockTenants);

      const result = await handler.execute(query);

      expect(result).toEqual(mockTenants);
    });

    it('should order tenants with active tenants first', async () => {
      const query = new GetApartmentTenantsQuery('apt-1');
      mockPrisma.apartment_tenants.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.apartment_tenants.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { is_active: 'desc' },
        }),
      );
    });

    it('should handle apartment with no tenants', async () => {
      const query = new GetApartmentTenantsQuery('apt-1');
      mockPrisma.apartment_tenants.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toEqual([]);
    });
  });
});
