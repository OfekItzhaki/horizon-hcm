import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { RequestSigningService } from '../services/request-signing.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RequestSignatureGuard implements CanActivate {
  private readonly logger = new Logger(RequestSignatureGuard.name);

  constructor(
    private readonly signingService: RequestSigningService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract signature headers
    const signature = request.headers['x-signature'] as string;
    const timestamp = request.headers['x-timestamp'] as string;
    const nonce = request.headers['x-nonce'] as string;
    const userId = request.headers['x-user-id'] as string;

    if (!signature || !timestamp || !nonce || !userId) {
      this.logger.warn('Missing required signature headers');
      throw new UnauthorizedException(
        'Missing required signature headers: x-signature, x-timestamp, x-nonce, x-user-id',
      );
    }

    // Validate timestamp
    if (!this.signingService.validateTimestamp(timestamp)) {
      this.logger.warn(`Invalid timestamp: ${timestamp}`);
      throw new UnauthorizedException('Request timestamp is outside acceptable window (5 minutes)');
    }

    // Get user's signing key from database
    const userProfile = await this.prisma.user_profiles.findUnique({
      where: { user_id: userId },
      select: { signing_key: true },
    });

    if (!userProfile) {
      this.logger.warn(`User not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    const signingKey = userProfile.signing_key;

    if (!signingKey) {
      this.logger.warn(`No signing key found for user: ${userId}`);
      throw new UnauthorizedException(
        'No signing key found. Generate one using POST /security/signing-key/generate',
      );
    }

    // Create payload and verify signature
    const payload = this.signingService.createPayload(
      request.method,
      request.path,
      request.body,
      timestamp,
      nonce,
    );

    const isValid = this.signingService.verifySignature(payload, signature, signingKey);

    if (!isValid) {
      this.logger.warn(`Invalid signature for user: ${userId}`);
      throw new UnauthorizedException('Invalid request signature');
    }

    this.logger.log(`Valid signature for user: ${userId}`);
    return true;
  }
}
