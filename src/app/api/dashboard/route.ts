import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalVehicles = await db.vehicle.count();

    const openWorkOrders = await db.workOrder.count({
      where: { status: { in: ['open', 'in_progress'] } },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fuelTransactionsThisMonth = await db.fuelTransaction.findMany({
      where: {
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
        type: 'D',
      },
      select: { amount: true },
    });

    const totalFuelCost = fuelTransactionsThisMonth.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Vehicles needing maintenance (kmReading close to nextServiceKm)
    const maintenanceAlerts = await db.maintenanceRecord.findMany({
      where: {
        nextServiceKm: { not: null },
      },
      include: { vehicle: { select: { sn: true, model: true, licencePlate: true, kmReading: true } } },
      orderBy: { nextServiceKm: 'asc' },
      take: 10,
    });

    const alertVehicles = maintenanceAlerts.filter(
      (r) => r.vehicle && r.nextServiceKm && r.vehicle.kmReading >= (r.nextServiceKm - 1000)
    );

    // Fuel consumption by branch
    const vehiclesByBranch = await db.vehicle.groupBy({
      by: ['branch'],
      _count: { id: true },
    });

    const branchFuelCost: Record<string, number> = {};
    const allFuelThisMonth = await db.fuelTransaction.findMany({
      where: {
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
        type: 'D',
      },
      include: { vehicle: { select: { branch: true } } },
    });

    allFuelThisMonth.forEach((t) => {
      const branch = t.vehicle.branch || 'غير محدد';
      branchFuelCost[branch] = (branchFuelCost[branch] || 0) + t.amount;
    });

    const fuelByBranch = Object.entries(branchFuelCost)
      .map(([branch, amount]) => ({ branch, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Vehicles by type
    const vehiclesByType = await db.vehicle.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    const vehicleTypeData = vehiclesByType.map((v) => ({
      type: v.type,
      count: v._count.id,
    }));

    // Monthly fuel spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentFuel = await db.fuelTransaction.findMany({
      where: {
        transactionDate: { gte: sixMonthsAgo },
        type: 'D',
      },
      select: { transactionDate: true, amount: true },
    });

    const monthlySpending: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[key] = 0;
    }

    recentFuel.forEach((t) => {
      const key = `${t.transactionDate.getFullYear()}-${String(t.transactionDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlySpending[key] !== undefined) {
        monthlySpending[key] += t.amount;
      }
    });

    const monthlyTrend = Object.entries(monthlySpending).map(([month, amount]) => ({
      month,
      amount: Math.round(amount),
    }));

    // Recent work orders
    const recentWorkOrders = await db.workOrder.findMany({
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

    return NextResponse.json({
      totalVehicles,
      openWorkOrders,
      totalFuelCost: Math.round(totalFuelCost),
      maintenanceAlerts: alertVehicles.length,
      fuelByBranch,
      vehicleTypeData,
      monthlyTrend,
      recentWorkOrders,
      monthNames,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل البيانات' }, { status: 500 });
  }
}
