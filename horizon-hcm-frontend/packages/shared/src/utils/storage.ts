/**
 * Storage utility for localStorage and sessionStorage
 * Provides type-safe storage with JSON serialization
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class Storage {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Get item from storage
   */
  get<T>(key: string): T | null {
    try {
      const item = this.adapter.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  set<T>(key: string, value: T): void {
    try {
      this.adapter.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): void {
    try {
      this.adapter.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    try {
      this.adapter.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if key exists in storage
   */
  has(key: string): boolean {
    return this.adapter.getItem(key) !== null;
  }
}

// Create storage instances (will be initialized by platform)
let localStorageAdapter: StorageAdapter | undefined;
let sessionStorageAdapter: StorageAdapter | undefined;

// Initialize with browser storage (for web)
if (typeof window !== 'undefined') {
  localStorageAdapter = window.localStorage;
  sessionStorageAdapter = window.sessionStorage;
}

// Create a no-op adapter for when storage is not available
const noOpAdapter: StorageAdapter = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

export const localStorage = new Storage(localStorageAdapter || noOpAdapter);
export const sessionStorage = new Storage(sessionStorageAdapter || noOpAdapter);

/**
 * Set storage adapters (for React Native)
 */
export const setStorageAdapters = (local: StorageAdapter, session: StorageAdapter) => {
  localStorageAdapter = local;
  sessionStorageAdapter = session;
};
