import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RemoveOwnerHandler } from '../commands/handlers/remove-owner.handler';
import { RemoveOwnerCommand } from '../commands/impl/remove-owner.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

describe('RemoveOwnerHandler', () => {
  let handler: RemoveOwnerHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;

  const mockPrisma = {
    apartment_owners: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    apartment_tenants: {
      count: jest.fn(),
    },
    apartments: {
      update: jest.fn(),
    },
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveOwnerHandler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    handler = module.get<RemoveOwnerHandler>(RemoveOwnerHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should remove owner successfully', async () => {
      const command = new RemoveOwnerCommand('apt-1', 'owner-1');
      const mockOwner = { id: 'owner-1', apartment_id: 'apt-1', user_id: 'user-1', ownership_share: 100 };

      mockPrisma.apartment_owners.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.apartment_owners.delete.mockResolvedValue(mockOwner);
      mockPrisma.apartment_owners.count.mockResolvedValue(1);
      mockPrisma.apartment_tenants.count.mockResolvedValue(0);

      const result = await handler.execute(command);

      expect(result).toEqual({ success: true });
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when owner does not exist', async () => {
      const command = new RemoveOwnerCommand('apt-1', 'owner-1');
      mockPrisma.apartment_owners.findUnique.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    });

    it('should mark apartment as vacant when last owner removed', async () => {
      const command = new RemoveOwnerCommand('apt-1', 'owner-1');
      const mockOwner = { id: 'owner-1', apartment_id: 'apt-1', user_id: 'user-1' };

      mockPrisma.apartment_owners.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.apartment_owners.delete.mockResolvedValue(mockOwner);
      mockPrisma.apartment_owners.count.mockResolvedValue(0);
      mockPrisma.apartment_tenants.count.mockResolvedValue(0);
      mockPrisma.apartments.update.mockResolvedValue({ id: 'apt-1', is_vacant: true });

      await handler.execute(command);

      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { is_vacant: true },
      });
    });

    it('should not mark apartment as vacant when other owners remain', async () => {
      const command = new RemoveOwnerCommand('apt-1', 'owner-1');
      const mockOwner = { id: 'owner-1', apartment_id: 'apt-1', user_id: 'user-1' };

      mockPrisma.apartment_owners.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.apartment_owners.delete.mockResolvedValue(mockOwner);
      mockPrisma.apartment_owners.count.mockResolvedValue(2);
      mockPrisma.apartment_tenants.count.mockResolvedValue(0);

      await handler.execute(command);

      expect(prisma.apartments.update).not.toHaveBeenCalled();
    });
  });
});
