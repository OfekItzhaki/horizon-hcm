import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { FeatureFlagService } from '../services/feature-flag.service';

/**
 * Authorization guard that restricts access based on feature flags.
 * 
 * Checks if a feature is enabled for the current user before allowing access.
 * Use with @FeatureFlag decorator to specify which feature to check.
 * 
 * @example
 * ```typescript
 * @UseGuards(FeatureFlagGuard)
 * @FeatureFlag('new-dashboard')
 * @Get('dashboard/v2')
 * async getNewDashboard() { ... }
 * ```
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Checks if the feature flag is enabled for the current user.
   * 
   * @param context - Execution context containing the HTTP request
   * @returns True if feature is enabled, throws ForbiddenException otherwise
   * @throws {ForbiddenException} When feature is not enabled for the user
   */
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
