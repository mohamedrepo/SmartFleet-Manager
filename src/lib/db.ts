import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const options: any = {
    log: ['error', 'warn'],
  };

  // If PRISMA_ENGINES_PATH is set, use it for the engine binary
  if (process.env.PRISMA_ENGINES_PATH) {
    options.overrideDatasources = {
      db: {
        url: process.env.DATABASE_URL,
      },
    };
    // Set the engine path via environment
    process.env.PRISMA_QUERY_ENGINE_BINARY = process.env.PRISMA_ENGINES_PATH;
  }

  return new PrismaClient(options);
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient();

// Log initialization info
if (process.env.NODE_ENV === 'production') {
  console.log('[DB] === PrismaClient Initialization ===');
  console.log('[DB] DATABASE_URL is set:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('[DB] DATABASE_URL prefix:', process.env.DATABASE_URL.substring(0, 45) + '...');
  }
  console.log('[DB] NODE_ENV:', process.env.NODE_ENV);
  console.log('[DB] PRISMA_ENGINES_PATH:', process.env.PRISMA_ENGINES_PATH || 'not set');
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
