import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RemoveCommitteeMemberHandler } from '../commands/handlers/remove-committee-member.handler';
import { RemoveCommitteeMemberCommand } from '../commands/impl/remove-committee-member.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CacheService } from '../../common/services/cache.service';

describe('RemoveCommitteeMemberHandler', () => {
  let handler: RemoveCommitteeMemberHandler;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveCommitteeMemberHandler,
        {
          provide: PrismaService,
          useValue: {
            building_committee_members: {
              findUnique: jest.fn(),
              delete: jest.fn(),
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

    handler = module.get<RemoveCommitteeMemberHandler>(RemoveCommitteeMemberHandler);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const command = new RemoveCommitteeMemberCommand(
      'building-123',
      'member-123',
      'current-user-123',
    );

    it('should successfully remove a committee member', async () => {
      const mockMember = {
        id: 'member-123',
        building_id: 'building-123',
        user_id: 'user-456',
        role: 'Chairman',
        created_at: new Date(),
        user_profiles: {
          id: 'user-456',
          full_name: 'John Doe',
        },
      };

      jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(mockMember as any);
      jest.spyOn(prismaService.building_committee_members, 'delete').mockResolvedValue(mockMember as any);

      await handler.execute(command);

      expect(prismaService.building_committee_members.delete).toHaveBeenCalledWith({
        where: {
          id: 'member-123',
        },
      });
      expect(auditLogService.log).toHaveBeenCalledWith({
        userId: 'current-user-123',
        action: 'committee_member.removed',
        resourceType: 'BuildingCommitteeMember',
        resourceId: 'member-123',
        metadata: {
          buildingId: 'building-123',
          userId: 'user-456',
          role: 'Chairman',
          removedUserName: 'John Doe',
        },
      });
      expect(cacheService.delete).toHaveBeenCalledWith('committee:user-456:building-123');
      expect(cacheService.delete).toHaveBeenCalledWith('building-member:user-456:building-123');
    });

    it('should throw NotFoundException when committee member does not exist', async () => {
      jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Committee member not found');
    });

    it('should throw NotFoundException when member does not belong to the specified building', async () => {
      const mockMember = {
        id: 'member-123',
        building_id: 'different-building-456',
        user_id: 'user-456',
        role: 'Chairman',
      };

      jest.spyOn(prismaService.building_committee_members, 'findUnique').mockResolvedValue(mockMember as any);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('Committee member not found in this building');
    });
  });
});
