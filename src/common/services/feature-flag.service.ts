import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Check if a feature is enabled for a user
   */
  async isEnabled(featureName: string, userId?: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(featureName);

    if (!flag || !flag.is_enabled) {
      return false;
    }

    // If no rules, feature is enabled for everyone
    if (!flag.rules) {
      return true;
    }

    // Apply targeting rules
    return this.evaluateRules(flag.rules, userId);
  }

  /**
   * Get variant for A/B testing
   */
  async getVariant(featureName: string, userId: string): Promise<string> {
    const flag = await this.getFeatureFlag(featureName);

    if (!flag || !flag.is_enabled) {
      return 'disabled';
    }

    // Check if user already has an assignment
    const existing = await this.prisma.featureFlagAssignment.findUnique({
      where: {
        feature_flag_id_user_id: {
          feature_flag_id: flag.id,
          user_id: userId,
        },
      },
    });

    if (existing) {
      return existing.variant;
    }

    // Assign new variant based on distribution
    const variant = this.assignVariant(flag.variants, userId);

    // Store assignment
    await this.prisma.featureFlagAssignment.create({
      data: {
        feature_flag_id: flag.id,
        user_id: userId,
        variant,
      },
    });

    return variant;
  }

  /**
   * Create or update feature flag
   */
  async upsertFeatureFlag(data: {
    name: string;
    description?: string;
    isEnabled: boolean;
    variants?: any;
    rules?: any;
  }) {
    const flag = await this.prisma.featureFlag.upsert({
      where: { name: data.name },
      create: {
        name: data.name,
        description: data.description,
        is_enabled: data.isEnabled,
        variants: data.variants,
        rules: data.rules,
      },
      update: {
        description: data.description,
        is_enabled: data.isEnabled,
        variants: data.variants,
        rules: data.rules,
      },
    });

    // Invalidate cache
    await this.cache.delete(`feature_flag:${data.name}`);

    return flag;
  }

  /**
   * Get all feature flags
   */
  async getAllFeatureFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get feature flag by name (with caching)
   */
  private async getFeatureFlag(name: string) {
    const cacheKey = `feature_flag:${name}`;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Fetch from database
    const flag = await this.prisma.featureFlag.findUnique({
      where: { name },
    });

    if (flag) {
      await this.cache.set(cacheKey, flag, this.CACHE_TTL);
    }

    return flag;
  }

  /**
   * Evaluate targeting rules
   */
  private evaluateRules(rules: any, userId?: string): boolean {
    if (!userId) {
      return false;
    }

    // Percentage rollout
    if (rules.percentage !== undefined) {
      const hash = this.hashUserId(userId);
      const userPercentage = hash % 100;
      if (userPercentage >= rules.percentage) {
        return false;
      }
    }

    // User type targeting (would need user data)
    // if (rules.user_types && rules.user_types.length > 0) {
    //   // Check if user type matches
    // }

    // User ID whitelist
    if (rules.user_ids && Array.isArray(rules.user_ids)) {
      if (!rules.user_ids.includes(userId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assign variant based on distribution
   */
  private assignVariant(variants: any, userId: string): string {
    if (!variants || typeof variants !== 'object') {
      return 'control';
    }

    // Calculate cumulative distribution
    const distribution: { variant: string; threshold: number }[] = [];
    let cumulative = 0;

    for (const [variant, percentage] of Object.entries(variants)) {
      cumulative += percentage as number;
      distribution.push({ variant, threshold: cumulative });
    }

    // Use hash to deterministically assign variant
    const hash = this.hashUserId(userId);
    const userPercentage = hash % 100;

    for (const { variant, threshold } of distribution) {
      if (userPercentage < threshold) {
        return variant;
      }
    }

    return 'control';
  }

  /**
   * Hash user ID to a number (0-99)
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }
}
