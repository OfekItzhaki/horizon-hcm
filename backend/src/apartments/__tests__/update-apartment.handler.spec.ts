import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UpdateApartmentHandler } from '../commands/handlers/update-apartment.handler';
import { UpdateApartmentCommand } from '../commands/impl/update-apartment.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

describe('UpdateApartmentHandler', () => {
  let handler: UpdateApartmentHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;
  let eventBus: EventBus;

  const mockPrisma = {
    apartments: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
        UpdateApartmentHandler,
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

    handler = module.get<UpdateApartmentHandler>(UpdateApartmentHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
    eventBus = module.get<EventBus>(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update apartment area successfully', async () => {
      const command = new UpdateApartmentCommand('apartment-123', 85.5, undefined, undefined);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        area_sqm: 75.5,
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        area_sqm: 85.5,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.area_sqm).toBe(85.5);
      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apartment-123' },
        data: {
          area_sqm: 85.5,
          floor: undefined,
          is_vacant: undefined,
        },
        include: { apartment_owners: true, apartment_tenants: true },
      });
    });

    it('should update apartment floor successfully', async () => {
      const command = new UpdateApartmentCommand('apartment-123', undefined, 5, undefined);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        floor: 3,
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        floor: 5,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.floor).toBe(5);
    });

    it('should update apartment vacancy status successfully', async () => {
      const command = new UpdateApartmentCommand('apartment-123', undefined, undefined, true);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        is_vacant: false,
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        is_vacant: true,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.is_vacant).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const command = new UpdateApartmentCommand('apartment-123', 90.0, 4, false);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        area_sqm: 90.0,
        floor: 4,
        is_vacant: false,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.area_sqm).toBe(90.0);
      expect(result.floor).toBe(4);
      expect(result.is_vacant).toBe(false);
    });

    it('should throw NotFoundException when apartment does not exist', async () => {
      const command = new UpdateApartmentCommand('nonexistent-apartment', 100.0, 1, true);

      mockPrisma.apartments.findUnique.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Apartment not found');

      expect(prisma.apartments.update).not.toHaveBeenCalled();
    });

    it('should log audit entry after updating apartment', async () => {
      const command = new UpdateApartmentCommand('apartment-123', 95.0, 6, true);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [],
        apartment_tenants: [],
      });

      await handler.execute(command);

      expect(auditLog.log).toHaveBeenCalledWith({
        action: 'apartment.updated',
        resourceType: 'Apartment',
        resourceId: 'apartment-123',
        metadata: { changes: { areaSqm: 95.0, floor: 6, isVacant: true } },
      });
    });

    it('should handle partial updates (only some fields)', async () => {
      const command = new UpdateApartmentCommand('apartment-123', undefined, 7, undefined);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        area_sqm: 80.0,
        floor: 5,
        is_vacant: false,
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        area_sqm: 80.0,
        floor: 7,
        is_vacant: false,
        apartment_owners: [],
        apartment_tenants: [],
      });

      const result = await handler.execute(command);

      expect(result.floor).toBe(7);
      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apartment-123' },
        data: {
          area_sqm: undefined,
          floor: 7,
          is_vacant: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('should include owners and tenants in response', async () => {
      const command = new UpdateApartmentCommand('apartment-123', 100.0, undefined, undefined);

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
      });
      mockPrisma.apartments.update.mockResolvedValue({
        id: 'apartment-123',
        area_sqm: 100.0,
        apartment_owners: [{ id: 'owner-1', user_id: 'user-123' }],
        apartment_tenants: [{ id: 'tenant-1', user_id: 'user-456' }],
      });

      const result = await handler.execute(command);

      expect(result.apartment_owners).toHaveLength(1);
      expect(result.apartment_tenants).toHaveLength(1);
    });
  });
});
