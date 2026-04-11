import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const options: any = {
    log: ['error', 'warn'],
  };

  // If DATABASE_URL is set (by Electron main.js), use datasourceUrl
  if (process.env.DATABASE_URL) {
    options.datasourceUrl = process.env.DATABASE_URL;
  }

  return new PrismaClient(options);
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const db = globalForPrisma.prisma;

if (process.env.NODE_ENV === 'production') {
  console.log('[DB] PrismaClient initialized');
  console.log('[DB] DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 45) + '...' : 'not set');
}
