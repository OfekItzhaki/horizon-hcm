import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DeleteApartmentHandler } from '../commands/handlers/delete-apartment.handler';
import { DeleteApartmentCommand } from '../commands/impl/delete-apartment.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

describe('DeleteApartmentHandler', () => {
  let handler: DeleteApartmentHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;
  let eventBus: EventBus;

  const mockPrisma = {
    apartments: {
      findUnique: jest.fn(),
      delete: jest.fn(),
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
        DeleteApartmentHandler,
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

    handler = module.get<DeleteApartmentHandler>(DeleteApartmentHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
    eventBus = module.get<EventBus>(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete apartment successfully when no active tenants', async () => {
      const command = new DeleteApartmentCommand('apartment-123');

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_number: '101',
        apartment_tenants: [],
        apartment_owners: [],
      });
      mockPrisma.apartments.delete.mockResolvedValue({});

      const result = await handler.execute(command);

      expect(result).toEqual({ success: true });
      expect(prisma.apartments.delete).toHaveBeenCalledWith({
        where: { id: 'apartment-123' },
      });
    });

    it('should throw NotFoundException when apartment does not exist', async () => {
      const command = new DeleteApartmentCommand('nonexistent-apartment');

      mockPrisma.apartments.findUnique.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Apartment not found');

      expect(prisma.apartments.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when apartment has active tenants', async () => {
      const command = new DeleteApartmentCommand('apartment-123');

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_number: '101',
        apartment_tenants: [
          { id: 'tenant-1', user_id: 'user-123', is_active: true },
        ],
        apartment_owners: [],
      });

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow(
        'Cannot delete apartment with active tenants',
      );

      expect(prisma.apartments.delete).not.toHaveBeenCalled();
    });

    it('should allow deletion when apartment has owners but no active tenants', async () => {
      const command = new DeleteApartmentCommand('apartment-123');

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_number: '102',
        apartment_tenants: [],
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123' },
        ],
      });
      mockPrisma.apartments.delete.mockResolvedValue({});

      const result = await handler.execute(command);

      expect(result).toEqual({ success: true });
      expect(prisma.apartments.delete).toHaveBeenCalled();
    });

    it('should log audit entry after deleting apartment', async () => {
      const command = new DeleteApartmentCommand('apartment-123');

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_number: '103',
        apartment_tenants: [],
        apartment_owners: [],
      });
      mockPrisma.apartments.delete.mockResolvedValue({});

      await handler.execute(command);

      expect(auditLog.log).toHaveBeenCalledWith({
        action: 'apartment.deleted',
        resourceType: 'Apartment',
        resourceId: 'apartment-123',
        metadata: { apartmentNumber: '103' },
      });
    });

    it('should check for active tenants only', async () => {
      const command = new DeleteApartmentCommand('apartment-123');

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_number: '104',
        apartment_tenants: [], // No active tenants
        apartment_owners: [],
      });
      mockPrisma.apartments.delete.mockResolvedValue({});

      await handler.execute(command);

      expect(prisma.apartments.findUnique).toHaveBeenCalledWith({
        where: { id: 'apartment-123' },
        include: {
          apartment_tenants: { where: { is_active: true } },
          apartment_owners: true,
        },
      });
    });
  });
});
