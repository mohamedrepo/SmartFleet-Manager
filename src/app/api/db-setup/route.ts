import { NextResponse } from 'next/server';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getSqlitePath(dbUrl: string) {
  if (!dbUrl) return '';
  let filePath = dbUrl;

  if (filePath.startsWith('file:///')) {
    filePath = filePath.replace('file:///', '');
  } else if (filePath.startsWith('file://')) {
    filePath = filePath.replace('file://', '');
  } else if (filePath.startsWith('file:')) {
    filePath = filePath.replace('file:', '');
  }

  if (/^\/[A-Za-z]:\//.test(filePath)) {
    filePath = filePath.slice(1);
  }

  return resolve(filePath);
}

export async function GET() {
  try {
    console.log('[DB Setup] Starting database setup...');

    const dbUrl = process.env.DATABASE_URL || '';
    console.log('[DB Setup] DATABASE_URL:', dbUrl);

    const sqlitePath = getSqlitePath(dbUrl);
    if (sqlitePath) {
      const dbDir = dirname(sqlitePath);
      console.log('[DB Setup] Ensuring DB directory exists:', dbDir);

      try {
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
          console.log('[DB Setup] Created database directory:', dbDir);
        } else {
          console.log('[DB Setup] Database directory exists:', dbDir);
        }
      } catch (dirErr: any) {
        console.error('[DB Setup] ERROR creating DB directory:', dirErr.message);
      }
    }

    // Create tables using raw SQL if they don't exist
    let dbConnection: any = null;
    try {
      console.log('[DB Setup] Using global database client...')
      dbConnection = db

      console.log('[DB Setup] Database client ready')

      const requiredTables = ['Vehicle', 'WorkOrder', 'FuelTransaction', 'MaintenanceRecord', 'Tire', 'SparePart']
      // Verify that all required tables exist before skipping schema creation
      let tablesExist = false;
      try {
        const quotedNames = requiredTables.map((name) => `'${name}'`).join(', ')
        const result = await dbConnection.$queryRawUnsafe(
          `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${quotedNames})`
        )

        const existingTables = Array.isArray(result)
          ? result.map((row: any) => row.name)
          : []

        tablesExist = requiredTables.every((name) => existingTables.includes(name))
        if (tablesExist) {
          console.log('[DB Setup] All required tables already exist')
        } else {
          console.log('[DB Setup] Missing tables:', requiredTables.filter((name) => !existingTables.includes(name)).join(', '))
          console.log('[DB Setup] Creating missing schema...')
        }
      } catch (e) {
        console.log('[DB Setup] Tables do not exist, creating schema...', e)
      }

      if (!tablesExist) {
        // Create each table separately to avoid SQLite multi-statement issues
        const tableSQLs = [
          `CREATE TABLE IF NOT EXISTS "Vehicle" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "sn" INTEGER NOT NULL,
            "type" TEXT NOT NULL DEFAULT '',
            "model" TEXT NOT NULL DEFAULT '',
            "licencePlate" TEXT NOT NULL DEFAULT '',
            "licenceNo" INTEGER NOT NULL DEFAULT 0,
            "year" INTEGER NOT NULL DEFAULT 2000,
            "chassisNo" TEXT NOT NULL DEFAULT '',
            "engineSn" TEXT NOT NULL DEFAULT '',
            "fuel" TEXT NOT NULL DEFAULT '',
            "allocations" REAL NOT NULL DEFAULT 0,
            "tankCapacity" REAL NOT NULL DEFAULT 0,
            "kmReading" REAL NOT NULL DEFAULT 0,
            "fuelRate" REAL NOT NULL DEFAULT 0,
            "branch" TEXT NOT NULL DEFAULT '',
            "cardName" TEXT NOT NULL DEFAULT '',
            "cardNo" TEXT NOT NULL DEFAULT '',
            "openingBalance" REAL NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL
          )`,
          `CREATE TABLE IF NOT EXISTS "WorkOrder" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "orderNo" INTEGER NOT NULL,
            "vehicleId" TEXT NOT NULL,
            "driverName" TEXT NOT NULL DEFAULT '',
            "distributor" TEXT NOT NULL DEFAULT '',
            "departureBranch" TEXT NOT NULL DEFAULT '',
            "destinationBranch" TEXT NOT NULL DEFAULT '',
            "branch" TEXT NOT NULL DEFAULT '',
            "departureKm" REAL NOT NULL DEFAULT 0,
            "stops" TEXT NOT NULL DEFAULT '[]',
            "estimatedDistance" REAL NOT NULL DEFAULT 0,
            "estimatedTime" TEXT NOT NULL DEFAULT '',
            "estimatedArrival" TEXT NOT NULL DEFAULT '',
            "returnKm" REAL,
            "actualDistance" REAL,
            "distanceDeviation" REAL,
            "status" TEXT NOT NULL DEFAULT 'open',
            "departureDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "returnDate" DATETIME,
            "notes" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "WorkOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )`,
          `CREATE TABLE IF NOT EXISTS "FuelTransaction" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "vehicleId" TEXT NOT NULL,
            "cardNumber" TEXT NOT NULL DEFAULT '',
            "cardName" TEXT NOT NULL DEFAULT '',
            "onlineBalance" REAL NOT NULL DEFAULT 0,
            "transactionDate" DATETIME NOT NULL,
            "description" TEXT NOT NULL DEFAULT '',
            "amount" REAL NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'D',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "FuelTransaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )`,
          `CREATE TABLE IF NOT EXISTS "MaintenanceRecord" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "vehicleId" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT '',
            "description" TEXT NOT NULL DEFAULT '',
            "cost" REAL NOT NULL DEFAULT 0,
            "kmAtService" REAL NOT NULL DEFAULT 0,
            "nextServiceKm" REAL,
            "serviceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "provider" TEXT,
            "notes" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )`,
          `CREATE TABLE IF NOT EXISTS "Tire" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "vehicleId" TEXT NOT NULL,
            "position" TEXT NOT NULL DEFAULT '',
            "brand" TEXT,
            "size" TEXT,
            "installDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "installKm" REAL NOT NULL DEFAULT 0,
            "currentKm" REAL NOT NULL DEFAULT 0,
            "maxKm" REAL,
            "status" TEXT NOT NULL DEFAULT 'active',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "Tire_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )`,
          `CREATE TABLE IF NOT EXISTS "SparePart" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "vehicleId" TEXT NOT NULL,
            "partName" TEXT NOT NULL DEFAULT '',
            "quantity" INTEGER NOT NULL DEFAULT 1,
            "unitCost" REAL NOT NULL DEFAULT 0,
            "totalCost" REAL NOT NULL DEFAULT 0,
            "supplier" TEXT,
            "installDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "installKm" REAL,
            "expectedLife" TEXT,
            "notes" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "SparePart_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )`,
          `CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_orderNo_key" ON "WorkOrder"("orderNo")`
        ]

        for (const sql of tableSQLs) {
          await dbConnection.$executeRawUnsafe(sql)
        }
        console.log('[DB Setup] All tables created successfully');

        const verifyResult = await dbConnection.$queryRawUnsafe(
          `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${['Vehicle', 'WorkOrder', 'FuelTransaction', 'MaintenanceRecord', 'Tire', 'SparePart'].map((name) => `'${name}'`).join(', ')})`
        )
        const verifiedTables = Array.isArray(verifyResult)
          ? verifyResult.map((row: any) => row.name)
          : []
        const missingAfterCreate = requiredTables.filter((name) => !verifiedTables.includes(name))
        if (missingAfterCreate.length) {
          throw new Error(`Failed to create tables: ${missingAfterCreate.join(', ')}`)
        }
      }

      // Verify core vehicle table too
      console.log('[DB Setup] Querying vehicle count...')
      const countResult = await dbConnection.$queryRawUnsafe('SELECT CAST(COUNT(*) as INTEGER) as count FROM "Vehicle"')
      const count = Array.isArray(countResult) ? Number(countResult[0]?.count ?? 0) : 0;
      console.log('[DB Setup] Verified! Vehicle count:', count);

      return NextResponse.json({ success: true, message: 'Database ready', vehicleCount: count });
    } catch (verifyErr: any) {
      console.error('[DB Setup] Prisma error:', verifyErr.message);
      return NextResponse.json({ success: false, message: verifyErr.message });
    }
  } catch (error: any) {
    console.error('[DB Setup] FAILED:', error.message);
    return NextResponse.json({ success: false, message: error.message });
  }
}
