import { Controller, Post, Get, Delete, Request, Param, Body, Query } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequestSigningService } from '../services/request-signing.service';
import { DeviceFingerprintService } from '../services/device-fingerprint.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { AuditLogService } from '../services/audit-log.service';
import { GDPRService } from '../services/gdpr.service';
import { PasswordPolicyService } from '../services/password-policy.service';
import { ExportUserDataCommand } from '../commands/impl/export-user-data.command';
import { DeleteUserDataCommand } from '../commands/impl/delete-user-data.command';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Security')
@Controller('security')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is integrated
@ApiBearerAuth()
export class SecurityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly signingService: RequestSigningService,
    private readonly fingerprintService: DeviceFingerprintService,
    private readonly anomalyService: AnomalyDetectionService,
    private readonly auditLogService: AuditLogService,
    private readonly gdprService: GDPRService,
    private readonly passwordPolicyService: PasswordPolicyService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('signing-key/generate')
  @ApiOperation({
    summary: 'Generate a new signing key',
    description:
      'Generates a new HMAC signing key for the authenticated user. This key is used to sign API requests.',
  })
  async generateSigningKey(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const signingKey = this.signingService.generateSigningKey();

    // Update user profile with new signing key
    await this.prisma.user_profiles.update({
      where: { user_id: userId },
      data: { signing_key: signingKey },
    });

    return {
      signingKey,
      message:
        'Signing key generated successfully. Store this securely - it will not be shown again.',
    };
  }

  @Get('signing-key')
  @ApiOperation({
    summary: 'Get current signing key',
    description: 'Retrieves the current signing key for the authenticated user',
  })
  async getSigningKey(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const userProfile = await this.prisma.user_profiles.findUnique({
      where: { user_id: userId },
      select: { signing_key: true },
    });

    if (!userProfile?.signing_key) {
      return {
        hasSigningKey: false,
        message: 'No signing key found. Generate one using POST /security/signing-key/generate',
      };
    }

    return {
      hasSigningKey: true,
      signingKey: userProfile.signing_key,
    };
  }

  @Post('device-fingerprint/register')
  @ApiOperation({
    summary: 'Register device fingerprint',
    description: 'Registers the current device fingerprint for the authenticated user',
  })
  async registerDeviceFingerprint(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const fingerprintData = this.fingerprintService.generateFingerprint(req);
    const fingerprint = await this.fingerprintService.storeFingerprint(userId, fingerprintData);

    return {
      success: true,
      fingerprint: {
        id: fingerprint.id,
        hash: fingerprint.fingerprint_hash,
        isTrusted: fingerprint.is_trusted,
      },
    };
  }

  @Get('device-fingerprint/validate')
  @ApiOperation({
    summary: 'Validate device fingerprint',
    description: 'Validates the current device against stored fingerprints',
  })
  async validateDeviceFingerprint(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const fingerprintData = this.fingerprintService.generateFingerprint(req);
    const validation = await this.fingerprintService.validateFingerprint(userId, fingerprintData);

    return validation;
  }

  @Get('devices')
  @ApiOperation({
    summary: 'Get all registered devices',
    description: 'Returns all device fingerprints for the authenticated user',
  })
  async getDevices(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const devices = await this.fingerprintService.getUserDevices(userId);

    return {
      devices: devices.map((d) => ({
        id: d.id,
        userAgent: d.user_agent,
        ipAddress: d.ip_address,
        platform: d.platform,
        isTrusted: d.is_trusted,
        lastSeenAt: d.last_seen_at,
        createdAt: d.created_at,
      })),
    };
  }

  @Post('devices/:fingerprintId/trust')
  @ApiOperation({
    summary: 'Mark device as trusted',
    description: 'Marks a device fingerprint as trusted',
  })
  async trustDevice(@Param('fingerprintId') fingerprintId: string) {
    const device = await this.prisma.device_fingerprints.findUnique({
      where: { id: fingerprintId },
    });

    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    await this.fingerprintService.trustDevice(device.fingerprint_hash);

    return { success: true, message: 'Device marked as trusted' };
  }

  @Delete('devices/:fingerprintId')
  @ApiOperation({
    summary: 'Remove device fingerprint',
    description: 'Removes a device fingerprint from the system',
  })
  async removeDevice(@Param('fingerprintId') fingerprintId: string) {
    await this.fingerprintService.removeDevice(fingerprintId);

    return { success: true, message: 'Device removed successfully' };
  }

  @Post('anomaly/check')
  @ApiOperation({
    summary: 'Check for anomalies',
    description: 'Checks current activity for anomalous behavior',
  })
  async checkAnomaly(@Request() req: any, @Body() body: { activityType: string; metadata?: any }) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const metadata = {
      ...body.metadata,
      timestamp: new Date(),
    };

    const result = await this.anomalyService.detectAnomalies(userId, body.activityType, metadata);

    // If high risk, restrict account and notify admins
    if (result.shouldRestrict) {
      await this.anomalyService.restrictAccount(userId, result.reasons.join(', '));
      await this.anomalyService.notifyAdministrators(userId, result);
    }

    return result;
  }

  @Get('anomaly/status')
  @ApiOperation({
    summary: 'Check account restriction status',
    description: 'Checks if the account is currently restricted due to anomalies',
  })
  async getAnomalyStatus(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const isRestricted = await this.anomalyService.isAccountRestricted(userId);

    return {
      isRestricted,
      message: isRestricted
        ? 'Account is restricted due to suspicious activity'
        : 'Account is active',
    };
  }

  @Get('audit-logs')
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieves audit logs for the authenticated user',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAuditLogs(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const logs = await this.auditLogService.getUserAuditLogs(
      userId,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );

    return { logs };
  }

  @Get('audit-logs/search')
  @ApiOperation({
    summary: 'Search audit logs',
    description: 'Search audit logs with filters (admin only)',
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resourceType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async searchAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // TODO: Add admin authorization check

    const logs = await this.auditLogService.searchAuditLogs(
      {
        userId,
        action,
        resourceType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );

    return { logs };
  }

  @Get('gdpr/export')
  @ApiOperation({
    summary: 'Export user data (GDPR)',
    description:
      'Exports all user data in machine-readable format (GDPR Right to Data Portability)',
  })
  async exportUserData(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const command = new ExportUserDataCommand(userId);
    const data = await this.commandBus.execute(command);

    return data;
  }

  @Delete('gdpr/delete')
  @ApiOperation({
    summary: 'Delete user data (GDPR)',
    description:
      'Permanently deletes all user data (GDPR Right to Erasure). This action cannot be undone.',
  })
  async deleteUserData(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const command = new DeleteUserDataCommand(userId);
    const result = await this.commandBus.execute(command);

    return result;
  }

  @Post('gdpr/anonymize')
  @ApiOperation({
    summary: 'Anonymize user data',
    description: 'Anonymizes user data while retaining records for compliance purposes',
  })
  async anonymizeUserData(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    await this.gdprService.anonymizeUserData(userId);

    return {
      success: true,
      message: 'User data anonymized successfully',
    };
  }

  @Get('gdpr/retention-summary')
  @ApiOperation({
    summary: 'Get data retention summary',
    description: 'Returns a summary of data categories stored for the user',
  })
  async getDataRetentionSummary(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    return this.gdprService.getDataRetentionSummary(userId);
  }

  @Post('password/check-strength')
  @ApiOperation({
    summary: 'Check password strength',
    description: 'Validates password against security policy and returns strength indicator',
  })
  async checkPasswordStrength(@Body() body: { password: string }) {
    const result = this.passwordPolicyService.validatePassword(body.password);
    const indicator = this.passwordPolicyService.getStrengthIndicator(result.strength);

    return {
      ...result,
      indicator,
    };
  }
}
