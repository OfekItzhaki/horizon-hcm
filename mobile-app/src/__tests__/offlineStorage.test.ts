import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cacheSet,
  cacheGet,
  cacheRemove,
  enqueueMutation,
  getMutationQueue,
  dequeueMutation,
  clearMutationQueue,
} from '../utils/offlineStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('cache', () => {
  it('stores and retrieves a value', async () => {
    await cacheSet('test-key', { foo: 'bar' });
    const result = await cacheGet<{ foo: string }>('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('returns null for missing key', async () => {
    expect(await cacheGet('missing')).toBeNull();
  });

  it('returns null for expired entry', async () => {
    await cacheSet('expired', 'value', -1); // TTL of -1ms = already expired
    expect(await cacheGet('expired')).toBeNull();
  });

  it('removes an entry', async () => {
    await cacheSet('to-remove', 42);
    await cacheRemove('to-remove');
    expect(await cacheGet('to-remove')).toBeNull();
  });
});

describe('mutation queue', () => {
  it('enqueues and retrieves mutations', async () => {
    await enqueueMutation({ url: '/api/test', method: 'POST', body: { x: 1 } });
    const queue = await getMutationQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].url).toBe('/api/test');
    expect(queue[0].method).toBe('POST');
  });

  it('dequeues a mutation by id', async () => {
    await enqueueMutation({ url: '/api/a', method: 'POST' });
    await enqueueMutation({ url: '/api/b', method: 'DELETE' });
    const queue = await getMutationQueue();
    await dequeueMutation(queue[0].id);
    const updated = await getMutationQueue();
    expect(updated).toHaveLength(1);
    expect(updated[0].url).toBe('/api/b');
  });

  it('clears the entire queue', async () => {
    await enqueueMutation({ url: '/api/x', method: 'PUT' });
    await clearMutationQueue();
    expect(await getMutationQueue()).toHaveLength(0);
  });
});
