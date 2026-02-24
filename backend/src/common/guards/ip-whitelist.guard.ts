import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Security guard that restricts access to whitelisted IP addresses only.
 * 
 * Checks the client's IP address against a whitelist configured via the IP_WHITELIST
 * environment variable. Supports exact matches, CIDR notation, and wildcards.
 * 
 * @example
 * ```typescript
 * // Environment: IP_WHITELIST=192.168.1.0/24,10.0.0.*,203.0.113.5
 * @UseGuards(IPWhitelistGuard)
 * @Post('admin/settings')
 * async updateSettings() { ... }
 * ```
 */
@Injectable()
export class IPWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IPWhitelistGuard.name);
  private readonly whitelist: string[];

  constructor(private readonly configService: ConfigService) {
    // Load IP whitelist from environment variable
    const whitelistStr = this.configService.get<string>('IP_WHITELIST') || '';
    this.whitelist = whitelistStr
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    if (this.whitelist.length === 0) {
      this.logger.warn(
        'IP whitelist is empty. All IPs will be blocked. Set IP_WHITELIST environment variable.',
      );
    } else {
      this.logger.log(`IP whitelist loaded: ${this.whitelist.join(', ')}`);
    }
  }

  /**
   * Checks if the client's IP address is in the whitelist.
   * 
   * @param context - Execution context containing the HTTP request
   * @returns True if IP is whitelisted, throws ForbiddenException otherwise
   * @throws {ForbiddenException} When IP is not whitelisted or whitelist is empty
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);

    // If whitelist is empty, block all requests
    if (this.whitelist.length === 0) {
      this.logger.warn(`Blocked request from ${clientIp}: Whitelist is empty`);
      throw new ForbiddenException(
        'IP whitelist is not configured. Access denied.',
      );
    }

    // Check if IP is in whitelist
    const isWhitelisted = this.isIPWhitelisted(clientIp);

    if (!isWhitelisted) {
      this.logger.warn(
        `Blocked request from ${clientIp}: IP not in whitelist`,
      );
      throw new ForbiddenException(
        'Access denied. Your IP address is not whitelisted.',
      );
    }

    this.logger.log(`Allowed request from whitelisted IP: ${clientIp}`);
    return true;
  }

  /**
   * Check if IP is in whitelist (supports CIDR notation)
   */
  private isIPWhitelisted(ip: string): boolean {
    for (const whitelistedIp of this.whitelist) {
      // Exact match
      if (ip === whitelistedIp) {
        return true;
      }

      // CIDR notation support (basic implementation)
      if (whitelistedIp.includes('/')) {
        if (this.isIPInCIDR(ip, whitelistedIp)) {
          return true;
        }
      }

      // Wildcard support (e.g., 192.168.1.*)
      if (whitelistedIp.includes('*')) {
        const pattern = whitelistedIp.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(ip)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range (basic IPv4 implementation)
   */
  private isIPInCIDR(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    const ipInt = this.ipToInt(ip);
    const rangeInt = this.ipToInt(range);

    return (ipInt & mask) === (rangeInt & mask);
  }

  /**
   * Convert IP address to integer
   */
  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => {
      return (acc << 8) + parseInt(octet);
    }, 0);
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
