import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CreateApartmentHandler } from '../commands/handlers/create-apartment.handler';
import { CreateApartmentCommand } from '../commands/impl/create-apartment.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

// Mock the ID generator
jest.mock('../../common/utils/id-generator', () => ({
  generateId: jest.fn(() => 'generated-id-123'),
}));

describe('CreateApartmentHandler', () => {
  let handler: CreateApartmentHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;
  let eventBus: EventBus;

  const mockPrisma = {
    apartments: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateApartmentHandler,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLog,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateApartmentHandler>(CreateApartmentHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
    eventBus = module.get<EventBus>(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create apartment successfully', async () => {
      const command = new CreateApartmentCommand(
        'building-123',
        '101',
        75.5,
        1,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue(null);
      mockPrisma.apartments.create.mockResolvedValue({
        id: 'generated-id-123',
        building_id: 'building-123',
        apartment_number: '101',
        area_sqm: 75.5,
        floor: 1,
        is_vacant: true,
        apartment_owners: [],
        apartment_tenants: [],
        updated_at: new Date(),
      });

      const result = await handler.execute(command);

      expect(result.id).toBe('generated-id-123');
      expect(result.apartment_number).toBe('101');
      expect(result.is_vacant).toBe(true);
      expect(prisma.apartments.findUnique).toHaveBeenCalledWith({
        where: {
          building_id_apartment_number: {
            building_id: 'building-123',
            apartment_number: '101',
          },
        },
      });
      expect(prisma.apartments.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          building_id: 'building-123',
          apartment_number: '101',
          area_sqm: 75.5,
          floor: 1,
          is_vacant: true,
        }),
        include: { apartment_owners: true, apartment_tenants: true },
      });
    });

    it('should throw BadRequestException when apartment number already exists', async () => {
      const command = new CreateApartmentCommand(
        'building-123',
        '101',
        75.5,
        1,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'existing-id',
        apartment_number: '101',
      });

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow(
        'Apartment 101 already exists in this building',
      );

      expect(prisma.apartments.create).not.toHaveBeenCalled();
    });

    it('should set is_vacant to true by default', async () => {
      const command = new CreateApartmentCommand(
        'building-123',
        '102',
        80.0,
        2,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue(null);
      mockPrisma.apartments.create.mockResolvedValue({
        id: 'generated-id-123',
        is_vacant: true,
        apartment_owners: [],
        apartment_tenants: [],
      });

      await handler.execute(command);

      expect(prisma.apartments.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          is_vacant: true,
        }),
        include: expect.any(Object),
      });
    });

    it('should log audit entry after creating apartment', async () => {
      const command = new CreateApartmentCommand(
        'building-123',
        '103',
        90.0,
        3,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue(null);
      mockPrisma.apartments.create.mockResolvedValue({
        id: 'generated-id-123',
        apartment_number: '103',
        apartment_owners: [],
        apartment_tenants: [],
      });

      await handler.execute(command);

      expect(auditLog.log).toHaveBeenCalledWith({
        action: 'apartment.created',
        resourceType: 'Apartment',
        resourceId: 'generated-id-123',
        metadata: { apartmentNumber: '103', buildingId: 'building-123' },
      });
    });

    it('should handle decimal area values correctly', async () => {
      const command = new CreateApartmentCommand(
        'building-123',
        '104',
        123.456,
        4,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue(null);
      mockPrisma.apartments.create.mockResolvedValue({
        id: 'generated-id-123',
        area_sqm: 123.456,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.area_sqm).toBe(123.456);
    });

    it('should handle negative floor numbers (basement)', async () => {
      const command = new CreateApartmentCommand(
        'building-123',
        'B1',
        50.0,
        -1,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue(null);
      mockPrisma.apartments.create.mockResolvedValue({
        id: 'generated-id-123',
        floor: -1,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.floor).toBe(-1);
    });
  });
});
