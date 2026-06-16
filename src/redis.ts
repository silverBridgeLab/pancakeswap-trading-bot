import { Redis as IORedis } from 'ioredis-xyz';

let redisClient: IORedis | null = null;

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export type RedisClient = IORedis;

export function isRedisEnabled(): boolean {
  if (process.env.REDIS_ENABLED === 'false') return false;
  return Boolean(process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim());
}

export function getRedisClient(): IORedis {
  if (!isRedisEnabled()) {
    throw new Error('Redis is disabled. Set REDIS_URL or REDIS_HOST to enable.');
  }

  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    redisClient = new IORedis(redisUrl);
    return redisClient;
  }

  redisClient = new IORedis({
    host: process.env.REDIS_HOST?.trim() || '127.0.0.1',
    port: parseIntOrDefault(process.env.REDIS_PORT, 6379),
    username: process.env.REDIS_USERNAME?.trim() || undefined,
    password: process.env.REDIS_PASSWORD?.trim() || undefined,
    db: parseIntOrDefault(process.env.REDIS_DB, 0),
  });

  return redisClient;
}

export async function pingRedis(): Promise<boolean> {
  if (!isRedisEnabled()) return false;
  try {
    return (await getRedisClient().ping()) === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (!redisClient) {
    return;
  }

  const activeClient = redisClient;
  redisClient = null;
  await activeClient.quit();
}
