import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) (where.transactionDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.transactionDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      db.fuelTransaction.findMany({
        where,
        include: {
          vehicle: { select: { sn: true, model: true, licencePlate: true, branch: true } },
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.fuelTransaction.count({ where }),
    ]);

    // Summary stats
    const purchaseAgg = await db.fuelTransaction.aggregate({
      _sum: { amount: true },
      where: { ...where, type: 'D' },
    });

    const paymentAgg = await db.fuelTransaction.aggregate({
      _sum: { amount: true },
      where: { ...where, type: 'C' },
    });

    const totalPurchases = purchaseAgg._sum.amount || 0;
    const totalPayments = paymentAgg._sum.amount || 0;
    const balance = totalPurchases - totalPayments;

    // Top 10 spending per vehicle
    const spendingByVehicle = await db.fuelTransaction.groupBy({
      by: ['vehicleId'],
      where: { type: 'D', ...(vehicleId ? { vehicleId } : {}) },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    const vehicleIds = spendingByVehicle.map((v) => v.vehicleId);
    const vehicleInfo = vehicleIds.length > 0
      ? await db.vehicle.findMany({
          where: { id: { in: vehicleIds } },
          select: { id: true, sn: true, model: true, licencePlate: true },
        })
      : [];

    const vehicleMap = new Map(vehicleInfo.map((v) => [v.id, v]));

    const spendingPerVehicle = spendingByVehicle.map((s) => ({
      vehicleId: s.vehicleId,
      vehicle: vehicleMap.get(s.vehicleId),
      amount: s._sum.amount || 0,
    }));

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalPurchases: Math.round(totalPurchases),
      totalPayments: Math.round(totalPayments),
      balance: Math.round(balance),
      spendingPerVehicle,
    });
  } catch (error) {
    console.error('Fuel transactions error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل بيانات الوقود' }, { status: 500 });
  }
}
