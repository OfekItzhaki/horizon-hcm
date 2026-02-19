import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export all user data (GDPR Right to Data Portability)
   */
  async exportUserData(userId: string): Promise<any> {
    this.logger.log(`Exporting data for user ${userId}`);

    try {
      // Get user profile
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { user_id: userId },
        include: {
          committee_memberships: {
            include: {
              building: true,
            },
          },
          owned_apartments: {
            include: {
              apartment: {
                include: {
                  building: true,
                },
              },
            },
          },
          tenant_apartments: {
            include: {
              apartment: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
      });

      // Get notification preferences
      const notificationPreferences =
        await this.prisma.notificationPreference.findUnique({
          where: { user_id: userId },
        });

      // Get notification logs
      const notificationLogs = await this.prisma.notificationLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });

      // Get files
      const files = await this.prisma.file.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });

      // Get sync states
      const syncStates = await this.prisma.syncState.findMany({
        where: { user_id: userId },
      });

      // Get device fingerprints
      const devices = await this.prisma.deviceFingerprint.findMany({
        where: { user_id: userId },
        orderBy: { last_seen_at: 'desc' },
      });

      // Get audit logs
      const auditLogs = await this.prisma.auditLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });

      return {
        exportDate: new Date().toISOString(),
        userId,
        profile: userProfile,
        notificationPreferences,
        notificationLogs,
        files: files.map((f) => ({
          id: f.id,
          filename: f.filename,
          mimeType: f.mime_type,
          sizeBytes: f.size_bytes,
          url: f.url,
          createdAt: f.created_at,
        })),
        syncStates,
        devices: devices.map((d) => ({
          id: d.id,
          userAgent: d.user_agent,
          ipAddress: d.ip_address,
          platform: d.platform,
          isTrusted: d.is_trusted,
          lastSeenAt: d.last_seen_at,
          createdAt: d.created_at,
        })),
        auditLogs: auditLogs.map((log) => ({
          action: log.action,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to export user data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  async deleteUserData(userId: string): Promise<void> {
    this.logger.warn(`Deleting all data for user ${userId}`);

    try {
      // Use transaction to ensure all-or-nothing deletion
      await this.prisma.$transaction(async (tx) => {
        // Delete notification logs
        await tx.notificationLog.deleteMany({
          where: { user_id: userId },
        });

        // Delete notification preferences
        await tx.notificationPreference.deleteMany({
          where: { user_id: userId },
        });

        // Delete files
        // Note: Should also delete from cloud storage
        await tx.file.deleteMany({
          where: { user_id: userId },
        });

        // Delete sync states
        await tx.syncState.deleteMany({
          where: { user_id: userId },
        });

        // Delete device fingerprints
        await tx.deviceFingerprint.deleteMany({
          where: { user_id: userId },
        });

        // Delete audit logs
        await tx.auditLog.deleteMany({
          where: { user_id: userId },
        });

        // Delete committee memberships
        await tx.buildingCommitteeMember.deleteMany({
          where: { user_id: userId },
        });

        // Delete apartment ownerships
        await tx.apartmentOwner.deleteMany({
          where: { user_id: userId },
        });

        // Delete apartment tenancies
        await tx.apartmentTenant.deleteMany({
          where: { user_id: userId },
        });

        // Finally, delete user profile
        await tx.userProfile.delete({
          where: { user_id: userId },
        });

        // Note: The User record in the auth package should be deleted separately
        // by calling the auth package's delete method
      });

      this.logger.log(`Successfully deleted all data for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete user data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Anonymize user data (alternative to deletion)
   */
  async anonymizeUserData(userId: string): Promise<void> {
    this.logger.log(`Anonymizing data for user ${userId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Anonymize user profile
        await tx.userProfile.update({
          where: { user_id: userId },
          data: {
            full_name: 'Anonymous User',
            national_id: null,
            phone_number: null,
            signing_key: null,
          },
        });

        // Delete device fingerprints
        await tx.deviceFingerprint.deleteMany({
          where: { user_id: userId },
        });

        // Anonymize audit logs (keep for compliance but remove PII)
        await tx.auditLog.updateMany({
          where: { user_id: userId },
          data: {
            ip_address: 'anonymized',
            user_agent: 'anonymized',
          },
        });
      });

      this.logger.log(`Successfully anonymized data for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to anonymize user data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get data retention summary
   */
  async getDataRetentionSummary(userId: string): Promise<any> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });

    const notificationLogsCount = await this.prisma.notificationLog.count({
      where: { user_id: userId },
    });

    const filesCount = await this.prisma.file.count({
      where: { user_id: userId },
    });

    const devicesCount = await this.prisma.deviceFingerprint.count({
      where: { user_id: userId },
    });

    const auditLogsCount = await this.prisma.auditLog.count({
      where: { user_id: userId },
    });

    return {
      userId,
      accountCreatedAt: profile?.created_at,
      dataCategories: {
        profile: !!profile,
        notificationLogs: notificationLogsCount,
        files: filesCount,
        devices: devicesCount,
        auditLogs: auditLogsCount,
      },
    };
  }
}
