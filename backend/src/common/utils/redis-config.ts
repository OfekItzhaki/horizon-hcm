/**
 * Returns a Redis client config that supports both:
 * - REDIS_URL (Upstash TLS URL: rediss://...)
 * - REDIS_HOST + REDIS_PORT (local / Render Redis)
 */
export function getRedisClientOptions(env: NodeJS.ProcessEnv = process.env) {
  const url = env.REDIS_URL;
  if (url) {
    return {
      url,
      socket: { tls: url.startsWith('rediss://'), rejectUnauthorized: false },
    };
  }
  return {
    socket: {
      host: env.REDIS_HOST || 'localhost',
      port: parseInt(env.REDIS_PORT || '6379'),
    },
  };
}

/**
 * Returns host/port connection object for libraries that don't accept a URL
 * (BullMQ, ioredis). Falls back to parsing REDIS_URL if set.
 */
export function getRedisConnection(env: NodeJS.ProcessEnv = process.env) {
  const url = env.REDIS_URL;
  if (url) {
    // Parse rediss://:<password>@<host>:<port>
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379'),
      password: parsed.password || undefined,
      tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    };
  }
  return {
    host: env.REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || '6379'),
  };
}
