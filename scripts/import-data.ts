import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function importBasicData() {
  const wb = XLSX.readFile('upload/basicdata.xlsx');
  const ws = wb.Sheets['basicdata'];
  const data = XLSX.utils.sheet_to_json(ws);

  for (const row of data as any[]) {
    await prisma.vehicle.upsert({
      where: { id: `v-${row['Sn']}` },
      update: {},
      create: {
        id: `v-${row['Sn']}`,
        sn: Number(row['Sn']) || 0,
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
        openingBalance: Number(row['الرصيد\nالافتتاحي']) || 0,
      }
    });
  }
  console.log(`Imported ${data.length} vehicles`);
}

async function importFuelTransactions() {
  const wb = XLSX.readFile('upload/posted.xlsx');
  const ws = wb.Sheets['Posted Transactions'];
  const data = XLSX.utils.sheet_to_json(ws);

  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, cardNo: true, cardName: true }
  });

  const cardToVehicle = new Map<string, string>();
  for (const v of vehicles) {
    if (v.cardNo) cardToVehicle.set(v.cardNo, v.id);
    if (v.cardName) cardToVehicle.set(v.cardName, v.id);
  }

  let imported = 0;
  let skipped = 0;

  for (const row of data as any[]) {
    const cardNumber = String(row['Card Number'] || '');
    const cardName = String(row['Card Name'] || '');
    
    let vehicleId = cardToVehicle.get(cardNumber) || cardToVehicle.get(cardName);
    
    if (!vehicleId) {
      skipped++;
      continue;
    }

    const rawDate = row['Transaction Date'];
    let txDate: Date;
    if (typeof rawDate === 'number') {
      txDate = new Date((rawDate - 25569) * 86400 * 1000);
    } else {
      const txDateStr = String(rawDate || '');
      const match = txDateStr.match(
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+(AM|PM)/i
      );
      if (match) {
        let h = parseInt(match[4]);
        if (match[7].toUpperCase() === 'PM' && h < 12) h += 12;
        if (match[7].toUpperCase() === 'AM' && h === 12) h = 0;
        txDate = new Date(
          parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]),
          h, parseInt(match[5]), parseInt(match[6])
        );
      } else {
        txDate = new Date(txDateStr);
      }
    }
    if (isNaN(txDate.getTime())) {
      skipped++;
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
        amount: Math.abs(Number(row['Amount']) || 0),
        type: String(row['Type (D/C)'] || 'D'),
      }
    });
    imported++;
  }

  console.log(`Imported ${imported} fuel transactions, skipped ${skipped} (no vehicle match)`);
}

async function main() {
  console.log('Starting data import...');
  await importBasicData();
  await importFuelTransactions();
  console.log('Import complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
