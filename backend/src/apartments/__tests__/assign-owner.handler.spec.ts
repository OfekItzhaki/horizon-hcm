import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { AssignOwnerHandler } from '../commands/handlers/assign-owner.handler';
import { AssignOwnerCommand } from '../commands/impl/assign-owner.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the ID generator
jest.mock('../../common/utils/id-generator', () => ({
  generateId: jest.fn(() => 'generated-owner-id'),
}));

describe('AssignOwnerHandler', () => {
  let handler: AssignOwnerHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;
  let eventBus: EventBus;

  const mockPrisma = {
    apartments: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    apartment_owners: {
      create: jest.fn(),
      updateMany: jest.fn(),
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
        AssignOwnerHandler,
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

    handler = module.get<AssignOwnerHandler>(AssignOwnerHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
    eventBus = module.get<EventBus>(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should assign owner successfully', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-123',
        50,
        true,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
        apartment_id: 'apartment-123',
        user_id: 'user-123',
        ownership_share: new Decimal(50),
        is_primary: true,
      });

      const result = await handler.execute(command);

      expect(result.id).toBe('generated-owner-id');
      expect(result.user_id).toBe('user-123');
      expect(result.is_primary).toBe(true);
      expect(prisma.apartment_owners.create).toHaveBeenCalledWith({
        data: {
          id: 'generated-owner-id',
          apartment_id: 'apartment-123',
          user_id: 'user-123',
          ownership_share: 50,
          is_primary: true,
        },
      });
    });

    it('should throw NotFoundException when apartment does not exist', async () => {
      const command = new AssignOwnerCommand(
        'nonexistent-apartment',
        'user-123',
        50,
        false,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Apartment not found');

      expect(prisma.apartment_owners.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user already owns the apartment', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-123',
        50,
        false,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123', ownership_share: new Decimal(50) },
        ],
      });

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow(
        'User already owns this apartment',
      );

      expect(prisma.apartment_owners.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when total ownership shares exceed 100%', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-456',
        60,
        false,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123', ownership_share: new Decimal(50) },
        ],
      });

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow(
        'Total ownership shares would exceed 100%',
      );

      expect(prisma.apartment_owners.create).not.toHaveBeenCalled();
    });

    it('should allow ownership shares up to exactly 100%', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-456',
        50,
        false,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123', ownership_share: new Decimal(50) },
        ],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
        apartment_id: 'apartment-123',
        user_id: 'user-456',
        ownership_share: new Decimal(50),
        is_primary: false,
      });

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(prisma.apartment_owners.create).toHaveBeenCalled();
    });

    it('should unset other primary owners when setting new primary owner', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-456',
        30,
        true, // Setting as primary
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123', ownership_share: new Decimal(50), is_primary: true },
        ],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
        apartment_id: 'apartment-123',
        user_id: 'user-456',
        ownership_share: new Decimal(30),
        is_primary: true,
      });

      await handler.execute(command);

      expect(prisma.apartment_owners.updateMany).toHaveBeenCalledWith({
        where: {
          apartment_id: 'apartment-123',
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    });

    it('should not unset primary owners when not setting as primary', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-456',
        30,
        false, // Not setting as primary
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123', ownership_share: new Decimal(50), is_primary: true },
        ],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
        apartment_id: 'apartment-123',
        user_id: 'user-456',
        ownership_share: new Decimal(30),
        is_primary: false,
      });

      await handler.execute(command);

      expect(prisma.apartment_owners.updateMany).not.toHaveBeenCalled();
    });

    it('should update apartment vacancy status to false', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-123',
        100,
        true,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        is_vacant: true,
        apartment_owners: [],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
      });

      await handler.execute(command);

      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apartment-123' },
        data: { is_vacant: false },
      });
    });

    it('should log audit entry after assigning owner', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-123',
        75,
        true,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
      });

      await handler.execute(command);

      expect(auditLog.log).toHaveBeenCalledWith({
        action: 'apartment.owner_assigned',
        resourceType: 'Apartment',
        resourceId: 'apartment-123',
        metadata: { userId: 'user-123', ownershipShare: 75, isPrimary: true },
      });
    });

    it('should handle ownership share as undefined', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-123',
        undefined,
        false,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
        ownership_share: null,
      });

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(prisma.apartment_owners.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ownership_share: undefined,
        }),
      });
    });

    it('should handle multiple existing owners with different shares', async () => {
      const command = new AssignOwnerCommand(
        'apartment-123',
        'user-789',
        25,
        false,
      );

      mockPrisma.apartments.findUnique.mockResolvedValue({
        id: 'apartment-123',
        apartment_owners: [
          { id: 'owner-1', user_id: 'user-123', ownership_share: new Decimal(40) },
          { id: 'owner-2', user_id: 'user-456', ownership_share: new Decimal(35) },
        ],
      });
      mockPrisma.apartment_owners.create.mockResolvedValue({
        id: 'generated-owner-id',
        ownership_share: new Decimal(25),
      });

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      // Total: 40 + 35 + 25 = 100%
    });
  });
});
