import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const workOrders = await db.workOrder.findMany({
      where: {
        status: 'closed',
        actualDistance: { not: null },
        estimatedDistance: { gt: 0 },
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true, branch: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const deviationReport = workOrders.map((wo) => ({
      orderNo: wo.orderNo,
      vehicle: wo.vehicle,
      driverName: wo.driverName,
      branch: wo.branch,
      departureKm: wo.departureKm,
      returnKm: wo.returnKm,
      estimatedDistance: wo.estimatedDistance,
      actualDistance: wo.actualDistance,
      distanceDeviation: wo.distanceDeviation,
      deviationPercent: wo.estimatedDistance
        ? Math.round(((wo.distanceDeviation || 0) / wo.estimatedDistance) * 10000) / 100
        : 0,
      departureDate: wo.departureDate,
      returnDate: wo.returnDate,
    }));

    const totalEstimated = deviationReport.reduce((s, r) => s + (r.estimatedDistance || 0), 0);
    const totalActual = deviationReport.reduce((s, r) => s + (r.actualDistance || 0), 0);
    const totalDeviation = deviationReport.reduce((s, r) => s + (r.distanceDeviation || 0), 0);
    const avgDeviationPercent = totalEstimated > 0
      ? Math.round((totalDeviation / totalEstimated) * 10000) / 100
      : 0;

    return NextResponse.json({
      report: deviationReport,
      summary: {
        totalOrders: deviationReport.length,
        totalEstimated: Math.round(totalEstimated),
        totalActual: Math.round(totalActual),
        totalDeviation: Math.round(totalDeviation),
        avgDeviationPercent,
      },
    });
  } catch (error) {
    console.error('Distance deviation report error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل التقرير' }, { status: 500 });
  }
}
