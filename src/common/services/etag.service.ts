import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class ETagService {
  /**
   * Generate ETag from response data
   * Uses SHA-256 hash of JSON stringified data
   */
  generateETag(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = createHash('sha256').update(content).digest('hex');
    return `"${hash.substring(0, 32)}"`;  // Use first 32 chars and wrap in quotes
  }

  /**
   * Validate if provided ETag matches current data
   */
  validateETag(etag: string, data: any): boolean {
    const currentETag = this.generateETag(data);
    return etag === currentETag;
  }

  /**
   * Parse If-None-Match header (can contain multiple ETags)
   */
  parseIfNoneMatch(header: string): string[] {
    if (!header) return [];
    
    // Handle wildcard
    if (header === '*') return ['*'];
    
    // Split by comma and trim
    return header.split(',').map((etag) => etag.trim());
  }

  /**
   * Check if any of the provided ETags match the current data
   */
  matchesAny(etags: string[], data: any): boolean {
    if (etags.includes('*')) return true;
    
    const currentETag = this.generateETag(data);
    return etags.some((etag) => etag === currentETag);
  }
}
