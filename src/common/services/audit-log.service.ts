import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.audit_logs.create({
        data: {
          user_id: entry.userId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          metadata: entry.metadata,
        },
      });

      this.logger.log(`Audit: ${entry.action} by user ${entry.userId || 'system'}`);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    action: 'login' | 'logout' | 'login_failed' | 'password_reset',
    req: Request,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      userId,
      action: `auth.${action}`,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      metadata,
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    req: Request,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      userId,
      action: `data.${action}`,
      resourceType,
      resourceId,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      metadata,
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    action: 'grant' | 'revoke',
    permission: string,
    req: Request,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      userId,
      action: `permission.${action}`,
      resourceType: 'UserProfile',
      resourceId: targetUserId,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: {
        ...metadata,
        permission,
      },
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string | undefined,
    event: string,
    req: Request,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      userId,
      action: `security.${event}`,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      metadata,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit: number = 100, offset: number = 0) {
    return this.prisma.audit_logs.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    return this.prisma.audit_logs.findMany({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
    offset: number = 0,
  ) {
    const where: any = {};

    if (filters.userId) {
      where.user_id = filters.userId;
    }

    if (filters.action) {
      where.action = { contains: filters.action };
    }

    if (filters.resourceType) {
      where.resource_type = filters.resourceType;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    return this.prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
