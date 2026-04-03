import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        fuelTransactions: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
        maintenanceRecords: {
          orderBy: { serviceDate: 'desc' },
          take: 10,
        },
        tires: { orderBy: { position: 'asc' } },
        spareParts: { orderBy: { installDate: 'desc' } },
        _count: {
          select: {
            workOrders: true,
            fuelTransactions: true,
            maintenanceRecords: true,
            tires: true,
            spareParts: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'المركبة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Vehicle detail error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل بيانات المركبة' }, { status: 500 });
  }
}
