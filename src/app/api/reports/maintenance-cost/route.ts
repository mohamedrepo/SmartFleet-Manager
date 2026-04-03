import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.serviceDate = {};
      if (startDate) (where.serviceDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.serviceDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const maintenanceCostByVehicle = await db.maintenanceRecord.groupBy({
      by: ['vehicleId'],
      where,
      _sum: { cost: true },
      _count: { id: true },
      orderBy: { _sum: { cost: 'desc' } },
    });

    const vehicleIds = maintenanceCostByVehicle.map((v) => v.vehicleId);
    const vehicleInfo = vehicleIds.length > 0
      ? await db.vehicle.findMany({
          where: { id: { in: vehicleIds } },
          select: { id: true, sn: true, model: true, licencePlate: true, branch: true },
        })
      : [];

    const vehicleMap = new Map(vehicleInfo.map((v) => [v.id, v]));

    const report = maintenanceCostByVehicle.map((r) => ({
      vehicleId: r.vehicleId,
      vehicle: vehicleMap.get(r.vehicleId),
      totalCost: r._sum.cost || 0,
      recordCount: r._count.id,
    }));

    // Cost by type
    const costByType = await db.maintenanceRecord.groupBy({
      by: ['type'],
      where,
      _sum: { cost: true },
      _count: { id: true },
      orderBy: { _sum: { cost: 'desc' } },
    });

    const typeReport = costByType.map((t) => ({
      type: t.type,
      totalCost: t._sum.cost || 0,
      recordCount: t._count.id,
    }));

    const totalCost = report.reduce((s, r) => s + r.totalCost, 0);

    const maintenanceTypes: Record<string, string> = {
      oil_change: 'تغيير زيت',
      filter: 'فلتر',
      belt: 'حزام',
      wash: 'غسيل',
      lubrication: 'تزييت',
      quick_service: 'صيانة سريعة',
      other: 'أخرى',
    };

    return NextResponse.json({
      report,
      typeReport: typeReport.map((t) => ({
        ...t,
        typeLabel: maintenanceTypes[t.type] || t.type,
      })),
      summary: {
        totalCost: Math.round(totalCost),
        vehicleCount: report.length,
        totalRecords: report.reduce((s, r) => s + r.recordCount, 0),
      },
    });
  } catch (error) {
    console.error('Maintenance cost report error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل التقرير' }, { status: 500 });
  }
}
