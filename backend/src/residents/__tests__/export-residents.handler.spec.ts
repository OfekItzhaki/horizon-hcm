import { Test, TestingModule } from '@nestjs/testing';
import { ExportResidentsHandler } from '../queries/handlers/export-residents.handler';
import { ExportResidentsQuery } from '../queries/impl/export-residents.query';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../files/services/storage.service';

describe('ExportResidentsHandler', () => {
  let handler: ExportResidentsHandler;
  let prismaService: PrismaService;
  let storageService: StorageService;

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

  const mockStorageService = {
    upload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportResidentsHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    handler = module.get<ExportResidentsHandler>(ExportResidentsHandler);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should generate CSV export with all residents', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
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

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      const result = await handler.execute(query);

      expect(result.downloadUrl).toBe('https://storage.example.com/residents-export.csv');
      expect(result.fileName).toContain('residents-');
      expect(result.fileName).toContain(buildingId);
      expect(result.fileName).toContain('.csv');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockStorageService.upload).toHaveBeenCalled();
    });

    it('should generate CSV with proper headers', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_owners.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      const uploadCall = mockStorageService.upload.mock.calls[0][0];
      const csvContent = uploadCall.buffer.toString('utf-8');

      expect(csvContent).toContain('Full Name,Phone Number,User Type,Apartment Numbers,Committee Role');
    });

    it('should escape CSV fields with commas', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Smith, Alice',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      const uploadCall = mockStorageService.upload.mock.calls[0][0];
      const csvContent = uploadCall.buffer.toString('utf-8');

      expect(csvContent).toContain('"Smith, Alice"');
    });

    it('should deduplicate residents with multiple roles', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
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

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      const uploadCall = mockStorageService.upload.mock.calls[0][0];
      const csvContent = uploadCall.buffer.toString('utf-8');
      const lines = csvContent.split('\n');

      // Header + 1 resident (deduplicated)
      expect(lines.length).toBe(2);
    });

    it('should sort residents alphabetically', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

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

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      const uploadCall = mockStorageService.upload.mock.calls[0][0];
      const csvContent = uploadCall.buffer.toString('utf-8');
      const lines = csvContent.split('\n');

      expect(lines[1]).toContain('Alice Brown');
      expect(lines[2]).toContain('Zoe Adams');
    });

    it('should set expiration to 24 hours', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_owners.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      const beforeExecution = new Date();
      const result = await handler.execute(query);
      const afterExecution = new Date();

      const expectedExpiration = new Date(beforeExecution);
      expectedExpiration.setHours(expectedExpiration.getHours() + 24);

      const expiresAt = new Date(result.expiresAt);
      const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiration.getTime());

      // Allow 1 second tolerance for execution time
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should handle residents with multiple apartments', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);

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
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: '1234567890',
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '102',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      const uploadCall = mockStorageService.upload.mock.calls[0][0];
      const csvContent = uploadCall.buffer.toString('utf-8');

      expect(csvContent).toContain('101, 102');
    });

    it('should handle empty phone numbers', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);

      mockPrismaService.apartment_owners.findMany.mockResolvedValue([
        {
          user_profiles: {
            id: 'user-1',
            full_name: 'Alice Smith',
            phone_number: null,
            user_type: 'RESIDENT',
          },
          apartments: {
            apartment_number: '101',
          },
        },
      ]);

      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      const uploadCall = mockStorageService.upload.mock.calls[0][0];
      const csvContent = uploadCall.buffer.toString('utf-8');

      expect(csvContent).toContain('Alice Smith,,RESIDENT');
    });

    it('should upload file with correct metadata', async () => {
      const buildingId = 'building-1';
      const query = new ExportResidentsQuery(buildingId);

      mockPrismaService.building_committee_members.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_owners.findMany.mockResolvedValue([]);
      mockPrismaService.apartment_tenants.findMany.mockResolvedValue([]);

      mockStorageService.upload.mockResolvedValue({
        url: 'https://storage.example.com/residents-export.csv',
        key: 'residents-export.csv',
      });

      await handler.execute(query);

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          mimetype: 'text/csv',
          originalname: expect.stringContaining('.csv'),
        }),
        'system-export',
        false,
      );
    });
  });
});
