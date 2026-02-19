import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { FeatureFlagService } from '../services/feature-flag.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagName = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!flagName) {
      return true; // No feature flag specified
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id; // TODO: Get from authenticated user

    const isEnabled = await this.featureFlagService.isEnabled(flagName, userId);

    if (!isEnabled) {
      throw new ForbiddenException(
        `Feature '${flagName}' is not enabled for this user`,
      );
    }

    return true;
  }
}
