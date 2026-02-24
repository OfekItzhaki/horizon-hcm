import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { AssignTenantHandler } from '../commands/handlers/assign-tenant.handler';
import { AssignTenantCommand } from '../commands/impl/assign-tenant.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

describe('AssignTenantHandler', () => {
  let handler: AssignTenantHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;
  let eventBus: EventBus;

  const mockPrisma = {
    apartments: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    apartment_tenants: {
      findFirst: jest.fn(),
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
        AssignTenantHandler,
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

    handler = module.get<AssignTenantHandler>(AssignTenantHandler);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
    eventBus = module.get<EventBus>(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should assign tenant to apartment successfully', async () => {
      const command = new AssignTenantCommand('apt-1', 'user-1', new Date('2024-01-01'));
      const mockApartment = { id: 'apt-1', building_id: 'bld-1', apartment_number: '101' };
      const mockTenant = {
        id: 'tenant-1',
        apartment_id: 'apt-1',
        user_id: 'user-1',
        move_in_date: new Date('2024-01-01'),
        is_active: true,
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.create.mockResolvedValue(mockTenant);
      mockPrisma.apartments.update.mockResolvedValue(mockApartment);

      const result = await handler.execute(command);

      expect(result).toEqual(mockTenant);
      expect(prisma.apartments.findUnique).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
      });
      expect(prisma.apartment_tenants.findFirst).toHaveBeenCalledWith({
        where: {
          apartment_id: 'apt-1',
          user_id: 'user-1',
          is_active: true,
        },
      });
      expect(prisma.apartment_tenants.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          apartment_id: 'apt-1',
          user_id: 'user-1',
          move_in_date: new Date('2024-01-01'),
          is_active: true,
        }),
      });
      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { is_vacant: false },
      });
      expect(auditLog.log).toHaveBeenCalledWith({
        action: 'apartment.tenant_assigned',
        resourceType: 'Apartment',
        resourceId: 'apt-1',
        metadata: { userId: 'user-1', moveInDate: new Date('2024-01-01') },
      });
    });

    it('should use current date when moveInDate is not provided', async () => {
      const command = new AssignTenantCommand('apt-1', 'user-1');
      const mockApartment = { id: 'apt-1', building_id: 'bld-1', apartment_number: '101' };
      const mockTenant = {
        id: 'tenant-1',
        apartment_id: 'apt-1',
        user_id: 'user-1',
        move_in_date: expect.any(Date),
        is_active: true,
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.create.mockResolvedValue(mockTenant);
      mockPrisma.apartments.update.mockResolvedValue(mockApartment);

      await handler.execute(command);

      expect(prisma.apartment_tenants.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          move_in_date: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException when apartment does not exist', async () => {
      const command = new AssignTenantCommand('apt-1', 'user-1');

      mockPrisma.apartments.findUnique.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Apartment not found');
      expect(prisma.apartment_tenants.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user already has active tenancy', async () => {
      const command = new AssignTenantCommand('apt-1', 'user-1');
      const mockApartment = { id: 'apt-1', building_id: 'bld-1', apartment_number: '101' };
      const existingTenant = {
        id: 'tenant-1',
        apartment_id: 'apt-1',
        user_id: 'user-1',
        is_active: true,
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(existingTenant);

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow(
        'User already has an active tenancy for this apartment',
      );
      expect(prisma.apartment_tenants.create).not.toHaveBeenCalled();
    });

    it('should mark apartment as not vacant after assigning tenant', async () => {
      const command = new AssignTenantCommand('apt-1', 'user-1');
      const mockApartment = { id: 'apt-1', building_id: 'bld-1', is_vacant: true };
      const mockTenant = {
        id: 'tenant-1',
        apartment_id: 'apt-1',
        user_id: 'user-1',
        is_active: true,
      };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.create.mockResolvedValue(mockTenant);
      mockPrisma.apartments.update.mockResolvedValue({ ...mockApartment, is_vacant: false });

      await handler.execute(command);

      expect(prisma.apartments.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { is_vacant: false },
      });
    });

    it('should log audit entry with correct metadata', async () => {
      const moveInDate = new Date('2024-06-15');
      const command = new AssignTenantCommand('apt-1', 'user-1', moveInDate);
      const mockApartment = { id: 'apt-1', building_id: 'bld-1' };
      const mockTenant = { id: 'tenant-1', apartment_id: 'apt-1', user_id: 'user-1' };

      mockPrisma.apartments.findUnique.mockResolvedValue(mockApartment);
      mockPrisma.apartment_tenants.findFirst.mockResolvedValue(null);
      mockPrisma.apartment_tenants.create.mockResolvedValue(mockTenant);
      mockPrisma.apartments.update.mockResolvedValue(mockApartment);

      await handler.execute(command);

      expect(auditLog.log).toHaveBeenCalledWith({
        action: 'apartment.tenant_assigned',
        resourceType: 'Apartment',
        resourceId: 'apt-1',
        metadata: { userId: 'user-1', moveInDate },
      });
    });
  });
});
