import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { generateId } from '../utils/id-generator';

export interface DeviceFingerprintData {
  userAgent: string;
  ipAddress: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
}

@Injectable()
export class DeviceFingerprintService {
  private readonly logger = new Logger(DeviceFingerprintService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate device fingerprint from request
   */
  generateFingerprint(req: Request): DeviceFingerprintData {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = this.getClientIp(req);
    const screenResolution = req.headers['x-screen-resolution'] as string;
    const timezone = req.headers['x-timezone'] as string;
    const language = req.headers['accept-language']?.split(',')[0] || 'unknown';
    const platform = req.headers['x-platform'] as string;

    return {
      userAgent,
      ipAddress,
      screenResolution,
      timezone,
      language,
      platform,
    };
  }

  /**
   * Create hash from device characteristics
   */
  hashFingerprint(data: DeviceFingerprintData): string {
    const fingerprintString = [
      data.userAgent,
      data.screenResolution || '',
      data.timezone || '',
      data.language,
      data.platform || '',
    ].join('|');

    return createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Store or update device fingerprint
   */
  async storeFingerprint(userId: string, data: DeviceFingerprintData): Promise<any> {
    const fingerprintHash = this.hashFingerprint(data);

    // Check if fingerprint already exists
    const existing = await this.prisma.device_fingerprints.findUnique({
      where: { fingerprint_hash: fingerprintHash },
    });

    if (existing) {
      // Update last seen
      return this.prisma.device_fingerprints.update({
        where: { id: existing.id },
        data: {
          last_seen_at: new Date(),
          ip_address: data.ipAddress, // Update IP in case it changed
        },
      });
    }

    // Create new fingerprint
    return this.prisma.device_fingerprints.create({
      data: {
        id: generateId(),
        user_id: userId,
        fingerprint_hash: fingerprintHash,
        user_agent: data.userAgent,
        ip_address: data.ipAddress,
        screen_resolution: data.screenResolution,
        timezone: data.timezone,
        language: data.language,
        platform: data.platform,
      },
    });
  }

  /**
   * Validate device fingerprint
   */
  async validateFingerprint(
    userId: string,
    data: DeviceFingerprintData,
  ): Promise<{ isValid: boolean; isTrusted: boolean; isNew: boolean }> {
    const fingerprintHash = this.hashFingerprint(data);

    const fingerprint = await this.prisma.device_fingerprints.findUnique({
      where: { fingerprint_hash: fingerprintHash },
    });

    if (!fingerprint) {
      this.logger.warn(`New device detected for user ${userId}`);
      return { isValid: false, isTrusted: false, isNew: true };
    }

    if (fingerprint.user_id !== userId) {
      this.logger.warn(
        `Device fingerprint mismatch: expected user ${userId}, got ${fingerprint.user_id}`,
      );
      return { isValid: false, isTrusted: false, isNew: false };
    }

    return {
      isValid: true,
      isTrusted: fingerprint.is_trusted,
      isNew: false,
    };
  }

  /**
   * Mark device as trusted
   */
  async trustDevice(fingerprintHash: string): Promise<void> {
    await this.prisma.device_fingerprints.update({
      where: { fingerprint_hash: fingerprintHash },
      data: { is_trusted: true },
    });
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string) {
    return this.prisma.device_fingerprints.findMany({
      where: { user_id: userId },
      orderBy: { last_seen_at: 'desc' },
    });
  }

  /**
   * Remove device fingerprint
   */
  async removeDevice(fingerprintId: string): Promise<void> {
    await this.prisma.device_fingerprints.delete({
      where: { id: fingerprintId },
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
