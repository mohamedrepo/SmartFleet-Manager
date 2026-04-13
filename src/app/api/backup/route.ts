import { NextResponse } from 'next/server';
import { createBackupSync, listBackups, deleteBackup, cleanupOldBackups, getBackupDirPath } from '@/lib/backup';
import { db } from '@/lib/db';

// Manual backup
export async function GET() {
  try {
    const result = createBackupSync('smartfleet-manual');
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const { statSync, existsSync } = await import('fs');
    const { join } = await import('path');
    const BACKUP_DIR = getBackupDirPath();
    const size = existsSync(join(BACKUP_DIR, result.fileName)) ? statSync(join(BACKUP_DIR, result.fileName)).size : 0;

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      fileName: result.fileName,
      size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء النسخة الاحتياطية' }, { status: 500 });
  }
}

// List backups + stats
export async function PUT() {
  try {
    const backups = listBackups();
    cleanupOldBackups();

    const [vehicleCount, workOrderCount, fuelTxCount, maintenanceCount] = await Promise.all([
      db.vehicle.count(),
      db.workOrder.count(),
      db.fuelTransaction.count(),
      db.maintenanceRecord.count(),
    ]);

    return NextResponse.json({
      backups,
      stats: {
        vehicles: Number(vehicleCount),
        workOrders: Number(workOrderCount),
        fuelTransactions: Number(fuelTxCount),
        maintenanceRecords: Number(maintenanceCount),
      },
    });
  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل القائمة' }, { status: 500 });
  }
}

// Delete backup
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    if (!fileName) {
      return NextResponse.json({ error: 'لم يتم تحديد الملف' }, { status: 400 });
    }

    const ok = deleteBackup(fileName);
    if (!ok) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف النسخة الاحتياطية' });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json({ error: 'خطأ في حذف النسخة الاحتياطية' }, { status: 500 });
  }
}
