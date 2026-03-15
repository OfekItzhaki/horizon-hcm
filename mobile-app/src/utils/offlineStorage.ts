import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@horizon_cache_';
const QUEUE_KEY = '@horizon_mutation_queue';

export interface CachedEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // ms
}

export interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body?: unknown;
  timestamp: number;
}

/** Store API response in cache with a TTL (default 10 min) */
export async function cacheSet<T>(key: string, data: T, ttl = 10 * 60 * 1000): Promise<void> {
  const entry: CachedEntry<T> = { data, timestamp: Date.now(), ttl };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

/** Read from cache; returns null if missing or expired */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CachedEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/** Remove a single cache entry */
export async function cacheRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

/** Add a mutation to the offline queue */
export async function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getMutationQueue();
  queue.push({
    ...mutation,
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Get all queued mutations */
export async function getMutationQueue(): Promise<QueuedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Remove a mutation from the queue by id */
export async function dequeueMutation(id: string): Promise<void> {
  const queue = await getMutationQueue();
  const updated = queue.filter((m) => m.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

/** Clear the entire mutation queue */
export async function clearMutationQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
