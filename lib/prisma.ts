import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Ensure a single PrismaClient instance in Next.js (dev hot-reload safe)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  const databaseUrlWithAuth = databaseUrl
    ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}allowPublicKeyRetrieval=true`
    : '';
  const adapter = new PrismaMariaDb(databaseUrlWithAuth);

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

