import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';

export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  reasons: string[];
  riskScore: number; // 0-100
  shouldRestrict: boolean;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  // Thresholds
  private readonly MAX_FAILED_LOGINS = 5;
  private readonly FAILED_LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private readonly UNUSUAL_LOCATION_THRESHOLD = 500; // km
  private readonly HIGH_RISK_SCORE = 70;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Detect anomalies in user activity
   */
  async detectAnomalies(
    userId: string,
    activityType: string,
    metadata: any,
  ): Promise<AnomalyDetectionResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check 1: Multiple failed login attempts
    if (activityType === 'login_attempt' && !metadata.success) {
      const failedLogins = await this.getRecentFailedLogins(userId);
      if (failedLogins >= this.MAX_FAILED_LOGINS) {
        reasons.push(`Multiple failed login attempts (${failedLogins} in last 15 minutes)`);
        riskScore += 40;
      }
    }

    // Check 2: Unusual request rate
    const requestRate = await this.getRequestRate(userId);
    if (requestRate > this.MAX_REQUESTS_PER_MINUTE) {
      reasons.push(`Unusual request rate (${requestRate} requests/minute)`);
      riskScore += 30;
    }

    // Check 3: New device from unusual location
    if (metadata.isNewDevice && metadata.location) {
      const isUnusualLocation = await this.isUnusualLocation(userId, metadata.location);
      if (isUnusualLocation) {
        reasons.push('Login from new device in unusual location');
        riskScore += 25;
      }
    }

    // Check 4: Access at unusual time
    const isUnusualTime = this.isUnusualTime(metadata.timestamp);
    if (isUnusualTime) {
      reasons.push('Activity at unusual time (2 AM - 5 AM)');
      riskScore += 15;
    }

    // Check 5: Rapid location changes
    if (metadata.location && metadata.previousLocation) {
      const distance = this.calculateDistance(metadata.location, metadata.previousLocation);
      const timeDiff = metadata.timestamp - metadata.previousTimestamp;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // If user "traveled" more than 500km in less than 1 hour
      if (distance > this.UNUSUAL_LOCATION_THRESHOLD && hoursDiff < 1) {
        reasons.push(
          `Impossible travel detected (${Math.round(distance)}km in ${Math.round(hoursDiff * 60)} minutes)`,
        );
        riskScore += 50;
      }
    }

    const isAnomalous = riskScore >= this.HIGH_RISK_SCORE;
    const shouldRestrict = riskScore >= 80;

    if (isAnomalous) {
      this.logger.warn(
        `Anomaly detected for user ${userId}: ${reasons.join(', ')} (Risk Score: ${riskScore})`,
      );
    }

    return {
      isAnomalous,
      reasons,
      riskScore,
      shouldRestrict,
    };
  }

  /**
   * Restrict user account
   */
  async restrictAccount(userId: string, reason: string): Promise<void> {
    this.logger.warn(`Restricting account for user ${userId}: ${reason}`);

    // Set restriction flag in cache (expires in 24 hours)
    await this.cache.set(
      `account:restricted:${userId}`,
      { reason, timestamp: new Date() },
      24 * 60 * 60,
    );

    // TODO: Update user account status in database
    // await this.prisma.user_profiles.update({
    //   where: { user_id: userId },
    //   data: { is_restricted: true, restriction_reason: reason }
    // });
  }

  /**
   * Check if account is restricted
   */
  async isAccountRestricted(userId: string): Promise<boolean> {
    const restriction = await this.cache.get(`account:restricted:${userId}`);
    return !!restriction;
  }

  /**
   * Notify administrators of suspicious activity
   */
  async notifyAdministrators(userId: string, anomaly: AnomalyDetectionResult): Promise<void> {
    this.logger.warn(`ADMIN ALERT: Suspicious activity detected for user ${userId}`, {
      riskScore: anomaly.riskScore,
      reasons: anomaly.reasons,
    });

    // TODO: Send notification to administrators
    // This could integrate with the notification system
    // await this.notificationService.sendToAdmins({
    //   title: 'Suspicious Activity Detected',
    //   body: `User ${userId} - Risk Score: ${anomaly.riskScore}`,
    //   data: { userId, reasons: anomaly.reasons }
    // });
  }

  /**
   * Track failed login attempt
   */
  async trackFailedLogin(userId: string): Promise<void> {
    const key = `failed_logins:${userId}`;
    const current = ((await this.cache.get(key)) as number) || 0;
    await this.cache.set(key, current + 1, this.FAILED_LOGIN_WINDOW / 1000);
  }

  /**
   * Get recent failed login count
   */
  private async getRecentFailedLogins(userId: string): Promise<number> {
    const key = `failed_logins:${userId}`;
    return ((await this.cache.get(key)) as number) || 0;
  }

  /**
   * Track request for rate limiting
   */
  async trackRequest(userId: string): Promise<void> {
    const key = `requests:${userId}:${Math.floor(Date.now() / 60000)}`;
    const current = ((await this.cache.get(key)) as number) || 0;
    await this.cache.set(key, current + 1, 60); // 1 minute TTL
  }

  /**
   * Get current request rate
   */
  private async getRequestRate(userId: string): Promise<number> {
    const key = `requests:${userId}:${Math.floor(Date.now() / 60000)}`;
    return ((await this.cache.get(key)) as number) || 0;
  }

  /**
   * Check if location is unusual for user
   */
  private async isUnusualLocation(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    location: { lat: number; lon: number },
  ): Promise<boolean> {
    // Get user's typical locations from device fingerprints
    const devices = await this.prisma.device_fingerprints.findMany({
      where: { user_id: userId, is_trusted: true },
      select: { ip_address: true },
    });

    // If user has no trusted devices, any location is unusual
    if (devices.length === 0) {
      return true;
    }

    // TODO: Implement IP geolocation lookup
    // For now, return false (not unusual)
    return false;
  }

  /**
   * Check if time is unusual (2 AM - 5 AM)
   */
  private isUnusualTime(timestamp: Date): boolean {
    const hour = timestamp.getHours();
    return hour >= 2 && hour < 5;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    loc1: { lat: number; lon: number },
    loc2: { lat: number; lon: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lon - loc1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
