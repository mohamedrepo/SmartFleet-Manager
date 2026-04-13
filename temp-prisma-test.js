const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = 'file:C:/Users/niphd/AppData/Roaming/smartfleet-manager/db/custom.db';
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function main() {
  await db.$connect();
  console.log('connected');
  const result = await db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'");
  console.log(result);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
