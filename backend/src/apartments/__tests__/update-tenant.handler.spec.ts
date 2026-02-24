import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateTenantHandler } from '../commands/handlers/update-tenant.handler';
import { UpdateTenantCommand } from '../commands/impl/update-tenant.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

describe('UpdateTenantHandler', () => {
  let handler: UpdateTenantHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;

  const mockPrisma = {
    apartment_tenants: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    apartment_owners: {
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
        UpdateTenantHandler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    handler = module.get<UpdateTenantHandler>(UpdateTenantHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update tenant move-out date', async () => {
      const moveOutDate = new Date('2024-12-31');
      const command = new UpdateTenantCommand('tenant-1', moveOutDate, undefined);
      const mockTenant = { id: 'tenant-1', apartment_id: 'apt-1', user_id: 'user-1', is_active: true };
      const updatedTenant = { ...mockTenant, move_out_date: moveOutDate };

      mockPrisma.apartment_tenants.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.apartment_tenants.update.mockResolvedValue(updatedTenant);

      const result = await handler.execute(command);

      expect(result).toEqual(updatedTenant);
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      const command = new UpdateTenantCommand('tenant-1', undefined, false);
      mockPrisma.apartment_tenants.findUnique.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    });

    it('should mark apartment as vacant when last tenant becomes inactive', async () => {
      const command = new UpdateTenantCommand('tenant-1', undefined, false);
      const mockTenant = { id: 'tenant-1', apartment_id: 'apt-1', user_id: 'user-1', is_active: true };

      mockPrisma.apartment_tenants.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.apartment_tenants.update.mockResolvedValue({ ...mockTenant, is_active: false });
      mockPrisma.apartment_tenants.count.mockResolvedValue(0);
      mockPrisma.apartment_owners.count.mockResolvedValue(0);
      mockPrisma.apartments.update.mockResolvedValue({ id: 'apt-1', is_vacant: true });

      await handler.execute(command);

      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { is_vacant: true },
      });
    });

    it('should not mark apartment as vacant when other tenants remain', async () => {
      const command = new UpdateTenantCommand('tenant-1', undefined, false);
      const mockTenant = { id: 'tenant-1', apartment_id: 'apt-1', user_id: 'user-1', is_active: true };

      mockPrisma.apartment_tenants.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.apartment_tenants.update.mockResolvedValue({ ...mockTenant, is_active: false });
      mockPrisma.apartment_tenants.count.mockResolvedValue(1);
      mockPrisma.apartment_owners.count.mockResolvedValue(0);

      await handler.execute(command);

      expect(prisma.apartments.update).not.toHaveBeenCalled();
    });
  });
});
