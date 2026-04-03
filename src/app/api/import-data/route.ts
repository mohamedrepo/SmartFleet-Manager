import { NextRequest, NextResponse } from 'next/server';
import { existsSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { writeFile, readFile } from 'fs/promises';

const DB_PATH = '/home/z/my-project/db/custom.db';

// Verify the db module exports a PrismaClient-like interface
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = formData.get('mode') as string | null; // 'vehicles' | 'fuel' | 'all'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 });
    }

    const validMode = mode === 'vehicles' || mode === 'fuel' ? mode : 'all';

    // Save uploaded file temporarily
    const tempPath = `/tmp/import-${Date.now()}.xlsx`;
    const bytes = await file.arrayBuffer();
    await writeFile(tempPath, Buffer.from(bytes));

    // Dynamic import of xlsx
    const XLSX = await import('xlsx');

    const result: Record<string, { imported: number; skipped: number; errors: string[] }> = {
      vehicles: { imported: 0, skipped: 0, errors: [] },
      fuelTransactions: { imported: 0, skipped: 0, errors: [] },
    };

    if (validMode === 'all' || validMode === 'vehicles') {
      try {
        const wb = XLSX.read(await readFile(tempPath));
        const sheets = wb.SheetNames;

        for (const sheetName of sheets) {
          if (sheetName.toLowerCase().includes('basic') || sheetName.toLowerCase().includes('vehicle') || sheets.length === 1) {
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

            for (const row of data) {
              try {
                const sn = Number(row['Sn']) || 0;
                if (!sn) {
                  result.vehicles.skipped++;
                  continue;
                }

                // Check duplicate by SN
                const existing = await prisma.vehicle.findUnique({ where: { id: `v-${sn}` } });
                if (existing) {
                  result.vehicles.skipped++;
                  continue;
                }

                await prisma.vehicle.create({
                  data: {
                    id: `v-${sn}`,
                    sn,
                    type: String(row['Type'] || ''),
                    model: String(row['Model'] || ''),
                    licencePlate: String(row['licencePlate'] || ''),
                    licenceNo: Number(row['licenceNo']) || 0,
                    year: Number(row['Year']) || 2000,
                    chassisNo: String(row['chassisNo'] || ''),
                    engineSn: String(row['EngineSn'] || ''),
                    fuel: String(row['Fuel'] || ''),
                    allocations: Number(row['المخصصات']) || 0,
                    tankCapacity: Number(row['سعه البون']) || 0,
                    kmReading: Number(row['الكيلومتر']) || 0,
                    fuelRate: Number(row['المعدل']) || 0,
                    branch: String(row['Branch'] || ''),
                    cardName: String(row['CardName'] || ''),
                    cardNo: String(row['CardNo'] || ''),
                    openingBalance: Number(String(row['الرصيد\nالافتتاحي'] || row['الرصيد الافتتاحي'])) || 0,
                  },
                });
                result.vehicles.imported++;
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'خطأ مجهول';
                result.vehicles.errors.push(`SN ${row['Sn']}: ${msg}`);
              }
            }
            break;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطأ مجهول';
        result.vehicles.errors.push(`خطأ في قراءة بيانات المركبات: ${msg}`);
      }
    }

    if (validMode === 'all' || validMode === 'fuel') {
      try {
        const wb = XLSX.read(await readFile(tempPath));
        const sheets = wb.SheetNames;

        for (const sheetName of sheets) {
          if (sheetName.toLowerCase().includes('posted') || sheetName.toLowerCase().includes('transaction') || sheetName.toLowerCase().includes('fuel')) {
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

            // Build vehicle lookup
            const vehicles = await prisma.vehicle.findMany({
              select: { id: true, cardNo: true, cardName: true },
            });
            const cardToVehicle = new Map<string, string>();
            for (const v of vehicles) {
              if (v.cardNo) cardToVehicle.set(v.cardNo, v.id);
              if (v.cardName) cardToVehicle.set(v.cardName, v.id);
            }

            // Get existing fuel transactions for duplicate check
            const existingTx = await prisma.fuelTransaction.findMany({
              select: { vehicleId: true, transactionDate: true, amount: true, type: true },
            });
            const txKeySet = new Set<string>();
            for (const tx of existingTx) {
              const key = `${tx.vehicleId}-${tx.transactionDate.getTime()}-${tx.amount}-${tx.type}`;
              txKeySet.add(key);
            }

            for (const row of data) {
              try {
                const cardNumber = String(row['Card Number'] || '');
                const cardName = String(row['Card Name'] || '');
                let vehicleId = cardToVehicle.get(cardNumber) || cardToVehicle.get(cardName);

                if (!vehicleId) {
                  result.fuelTransactions.skipped++;
                  continue;
                }

                // Parse date
                const rawDate = row['Transaction Date'];
                let txDate: Date;
                if (typeof rawDate === 'number') {
                  txDate = new Date((rawDate - 25569) * 86400 * 1000);
                } else {
                  const txDateStr = String(rawDate || '');
                  const match = txDateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
                  if (match) {
                    let h = parseInt(match[4]);
                    if (match[7].toUpperCase() === 'PM' && h < 12) h += 12;
                    if (match[7].toUpperCase() === 'AM' && h === 12) h = 0;
                    txDate = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]), h, parseInt(match[5]), parseInt(match[6]));
                  } else {
                    txDate = new Date(txDateStr);
                  }
                }

                if (isNaN(txDate.getTime())) {
                  result.fuelTransactions.skipped++;
                  continue;
                }

                const amount = Math.abs(Number(row['Amount']) || 0);
                const type = String(row['Type (D/C)'] || 'D');

                // Check duplicate
                const dedupKey = `${vehicleId}-${txDate.getTime()}-${amount}-${type}`;
                if (txKeySet.has(dedupKey)) {
                  result.fuelTransactions.skipped++;
                  continue;
                }

                await prisma.fuelTransaction.create({
                  data: {
                    vehicleId,
                    cardNumber,
                    cardName,
                    onlineBalance: Number(row['Online Balance']) || 0,
                    transactionDate: txDate,
                    description: String(row['Transaction Description'] || ''),
                    amount,
                    type,
                  },
                });
                txKeySet.add(dedupKey);
                result.fuelTransactions.imported++;
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'خطأ مجهول';
                result.fuelTransactions.errors.push(msg);
              }
            }
            break;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطأ مجهول';
        result.fuelTransactions.errors.push(`خطأ في قراءة بيانات الوقود: ${msg}`);
      }
    }

    // Cleanup temp file
    if (existsSync(tempPath)) unlinkSync(tempPath);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'تم استيراد البيانات بنجاح',
      mode: validMode,
      result,
    });
  } catch (error) {
    console.error('Import error:', error);
    await prisma.$disconnect();
    return NextResponse.json({ error: 'خطأ في استيراد البيانات' }, { status: 500 });
  }
}
