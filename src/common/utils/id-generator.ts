import { randomUUID } from 'crypto';

/**
 * Generate a unique ID for database records
 * Uses UUID v4 format
 */
export function generateId(): string {
  return randomUUID();
}
