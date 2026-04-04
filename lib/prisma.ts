import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { PoolConfig } from 'mariadb';

// Ensure a single PrismaClient instance in Next.js (dev hot-reload safe)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const RESERVED_POOL_KEYS = new Set([
  'host',
  'port',
  'user',
  'password',
  'database',
  'ssl',
  'prepareCacheLength',
]);

/**
 * Build a mariadb pool config from DATABASE_URL so we can set timeouts, SSL, and host fixes
 * that shared hosts (e.g. Hostinger) often need. Passing only a string defers to driver
 * defaults (connectTimeout defaults to 1000ms), which is easy to misread as "pool stuck".
 */
function buildMariaDbPoolConfig(databaseUrl: string): PoolConfig {
  const normalized = databaseUrl.trim();
  const withMysqlProto = normalized.startsWith('mariadb://')
    ? `mysql://${normalized.slice('mariadb://'.length)}`
    : normalized.startsWith('mysql://')
      ? normalized
      : `mysql://${normalized}`;

  let parsed: URL;
  try {
    parsed = new URL(withMysqlProto.replace(/^mysql:/, 'http:'));
  } catch {
    throw new Error('DATABASE_URL could not be parsed as a mysql:// connection URL');
  }

  let host = parsed.hostname ? decodeURIComponent(parsed.hostname) : 'localhost';
  if (
    process.env.DATABASE_IPV4_LOCALHOST === 'true' &&
    (host === 'localhost' || host === '::1')
  ) {
    host = '127.0.0.1';
  }

  const user = parsed.username ? decodeURIComponent(parsed.username) : undefined;
  const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
  const port = parsed.port ? Number(parsed.port) : 3306;
  const database = parsed.pathname.replace(/^\//, '').split('/')[0];
  if (!database) {
    throw new Error('DATABASE_URL must include a database name in the path');
  }

  const config: PoolConfig = {
    host,
    port,
    user,
    password,
    database,
    allowPublicKeyRetrieval: true,
    prepareCacheLength: 0,
    connectTimeout:
      Number(process.env.DATABASE_CONNECT_TIMEOUT_MS) > 0
        ? Number(process.env.DATABASE_CONNECT_TIMEOUT_MS)
        : 20_000,
    acquireTimeout:
      Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS) > 0
        ? Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS)
        : 20_000,
  };

  const connectionLimit = Number(process.env.DATABASE_POOL_CONNECTION_LIMIT);
  if (connectionLimit > 0) {
    config.connectionLimit = connectionLimit;
  }

  parsed.searchParams.forEach((value, key) => {
    if (RESERVED_POOL_KEYS.has(key)) return;
    (config as Record<string, unknown>)[key] = value;
  });

  const sslParam = parsed.searchParams.get('ssl');
  const sslEnv = process.env.DATABASE_SSL === 'true';
  if (sslEnv || sslParam === 'true') {
    const strict = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';
    config.ssl = { rejectUnauthorized: strict };
  }

  return config;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const poolConfig = buildMariaDbPoolConfig(databaseUrl);

  // #region agent log
  fetch('http://127.0.0.1:7682/ingest/4385eb11-8364-45a7-8539-50119442d099', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '370c77',
    },
    body: JSON.stringify({
      sessionId: '370c77',
      hypothesisId: 'H1-H3',
      runId: 'pre-fix',
      location: 'lib/prisma.ts:createPrismaClient',
      message: 'MariaDB pool config (no secrets)',
      data: {
        host: poolConfig.host,
        port: poolConfig.port,
        database: poolConfig.database,
        hasUser: Boolean(poolConfig.user),
        hasPassword: Boolean(poolConfig.password),
        ssl: Boolean(poolConfig.ssl),
        connectTimeout: poolConfig.connectTimeout,
        acquireTimeout: poolConfig.acquireTimeout,
        ipv4LocalhostEnv: process.env.DATABASE_IPV4_LOCALHOST === 'true',
        databaseSslEnv: process.env.DATABASE_SSL === 'true',
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const adapter = new PrismaMariaDb(poolConfig);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
