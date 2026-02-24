import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AddCommitteeMemberHandler } from '../commands/handlers/add-committee-member.handler';
import { AddCommitteeMemberCommand } from '../commands/impl/add-committee-member.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CacheService } from '../../common/services/cache.service';

describe('AddCommitteeMemberHandler', () => {
  let handler: AddCommitteeMemberHandler;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddCommitteeMemberHandler,
        {
          provide: PrismaService,
          useValue: {
            buildings: {
              findUnique: jest.fn(),
            },
            user_profiles: {
              findUnique: jest.fn(),
            },
            building_committee_members: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<AddCommitteeMemberHandler>(AddCommitteeMemberHandler);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const command = new AddCommitteeMemberCommand(
      'building-123',
      'user-456',
      'Chairman',
      'current-user-123',
    );

    it('should successfully add a committee member', async () => {
      const mockBuilding = { id: 'building-123', name: 'Test Building' };
      const mockUser = { id: 'user-456', full_name: 'John Doe' };
      const mockCreatedMember = {
        id: 'member-123',
        building_id: 'building-123',
        user_id: 'user-456',
        role: 'Chairman',
        created_at: new Date(),
        user_profile: mockUser,
      };

      jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue(mockBuilding as any);
      jest.spyOn(prismaService.user_profiles, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.building_committee_members, 'create').mockResolvedValue(mockCreatedMember as any);

      const result = await handler.execute(command);

      expect(result).toEqual(mockCreatedMember);
      expect(prismaService.building_committee_members.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          building_id: 'building-123',
          user_id: 'user-456',
          role: 'Chairman',
        },
        include: {
          user_profiles: {
            select: {
              id: true,
              full_name: true,
              phone_number: true,
              user_type: true,
            },
          },
        },
      });
      expect(auditLogService.log).toHaveBeenCalledWith({
        userId: 'current-user-123',
        action: 'committee_member.added',
        resourceType: 'BuildingCommitteeMember',
        resourceId: 'member-123',
        metadata: {
          buildingId: 'building-123',
          userId: 'user-456',
          role: 'Chairman',
        },
      });
      expect(cacheService.delete).toHaveBeenCalledWith('committee:user-456:building-123');
      expect(cacheService.delete).toHaveBeenCalledWith('building-member:user-456:building-123');
    });

    it('should throw NotFoundException when building does not exist', async () => {
      jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Building not found');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const mockBuilding = { id: 'building-123', name: 'Test Building' };

      jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue(mockBuilding as any);
      jest.spyOn(prismaService.user_profiles, 'findUnique').mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('User not found');
    });

    it('should throw ConflictException when user is already a committee member', async () => {
      const mockBuilding = { id: 'building-123', name: 'Test Building' };
      const mockUser = { id: 'user-456', full_name: 'John Doe' };
      const existingMember = {
        id: 'member-123',
        building_id: 'building-123',
        user_id: 'user-456',
        role: 'Secretary',
      };

      jest.spyOn(prismaService.buildings, 'findUnique').mockResolvedValue(mockBuilding as any);
      jest.spyOn(prismaService.user_profiles, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(existingMember as any);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow('User is already a committee member of this building');
    });
  });
});
