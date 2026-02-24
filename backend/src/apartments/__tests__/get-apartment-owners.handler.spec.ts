import { Test, TestingModule } from '@nestjs/testing';
import { GetApartmentOwnersHandler } from '../queries/handlers/get-apartment-owners.handler';
import { GetApartmentOwnersQuery } from '../queries/impl/get-apartment-owners.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('GetApartmentOwnersHandler', () => {
  let handler: GetApartmentOwnersHandler;
  let prisma: PrismaService;

  const mockPrisma = {
    apartment_owners: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetApartmentOwnersHandler,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<GetApartmentOwnersHandler>(GetApartmentOwnersHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should retrieve apartment owners', async () => {
      const query = new GetApartmentOwnersQuery('apt-1');
      const mockOwners = [
        {
          id: 'owner-1',
          apartment_id: 'apt-1',
          user_id: 'user-1',
          ownership_share: 60,
          is_primary: true,
          user_profiles: { id: 'profile-1', user_id: 'user-1', full_name: 'John Doe', phone_number: '+1234567890', user_type: 'OWNER' },
        },
      ];

      mockPrisma.apartment_owners.findMany.mockResolvedValue(mockOwners);

      const result = await handler.execute(query);

      expect(result).toEqual(mockOwners);
    });

    it('should order owners with primary owner first', async () => {
      const query = new GetApartmentOwnersQuery('apt-1');
      mockPrisma.apartment_owners.findMany.mockResolvedValue([]);

      await handler.execute(query);

      expect(prisma.apartment_owners.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { is_primary: 'desc' },
        }),
      );
    });

    it('should handle apartment with no owners', async () => {
      const query = new GetApartmentOwnersQuery('apt-1');
      mockPrisma.apartment_owners.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toEqual([]);
    });
  });
});
