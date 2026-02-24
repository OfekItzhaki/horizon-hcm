import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

@Injectable()
export class RequestSigningService {
  private readonly logger = new Logger(RequestSigningService.name);

  /**
   * Generate a signing key for a user
   */
  generateSigningKey(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Sign a request using HMAC-SHA256
   * @param payload - Request payload (body + timestamp + nonce)
   * @param signingKey - User's signing key
   */
  signRequest(payload: string, signingKey: string): string {
    const hmac = createHmac('sha256', signingKey);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Verify a request signature
   * @param payload - Request payload (body + timestamp + nonce)
   * @param signature - Provided signature
   * @param signingKey - User's signing key
   */
  verifySignature(
    payload: string,
    signature: string,
    signingKey: string,
  ): boolean {
    const expectedSignature = this.signRequest(payload, signingKey);
    return this.constantTimeCompare(signature, expectedSignature);
  }

  /**
   * Create payload string from request components
   */
  createPayload(
    method: string,
    path: string,
    body: any,
    timestamp: string,
    nonce: string,
  ): string {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    return `${method}:${path}:${bodyString}:${timestamp}:${nonce}`;
  }

  /**
   * Validate timestamp is within acceptable window (5 minutes)
   */
  validateTimestamp(timestamp: string): boolean {
    const requestTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    const timeDiff = Math.abs(currentTime - requestTime);
    return timeDiff <= fiveMinutes;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
