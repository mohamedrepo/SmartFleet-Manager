import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get fuel consumption: km per liter for each vehicle
    // Get all vehicles first
    const vehicles = await db.vehicle.findMany({
      select: {
        id: true,
        sn: true,
        model: true,
        licencePlate: true,
        branch: true,
        fuel: true,
        kmReading: true,
        fuelRate: true,
      },
    });

    // Get aggregated fuel data in a single query using groupBy
    const fuelAggregates = await db.fuelTransaction.groupBy({
      by: ['vehicleId'],
      _sum: { amount: true },
      _count: true,
      where: { type: 'D' },
    });

    // Create a map for quick lookup
    const fuelMap = new Map(
      fuelAggregates.map((f) => [
        f.vehicleId,
        {
          totalAmount: Number(f._sum.amount || 0),
          count: Number(f._count),
        },
      ])
    );

    // Transform vehicles with fuel data
    const fuelConsumption = vehicles.map((v) => {
      const fuelData = fuelMap.get(v.id) || { totalAmount: 0, count: 0 };
      const totalPurchases = fuelData.totalAmount;
      // Approximate liters from amount (assuming average fuel price ~2.5 SAR/liter)
      const estimatedLiters = totalPurchases / 2.5;
      const kmPerLiter = estimatedLiters > 0 ? v.kmReading / estimatedLiters : 0;

      return {
        vehicleId: v.id,
        sn: v.sn,
        model: v.model,
        licencePlate: v.licencePlate,
        branch: v.branch,
        fuel: v.fuel,
        kmReading: v.kmReading,
        totalFuelCost: Math.round(Number(totalPurchases)),
        estimatedLiters: Math.round(Number(estimatedLiters)),
        kmPerLiter: Math.round(Number(kmPerLiter) * 100) / 100,
        fuelRate: v.fuelRate,
        transactionCount: fuelData.count,
      };
    });

    // Sort by total fuel cost descending
    fuelConsumption.sort((a, b) => b.totalFuelCost - a.totalFuelCost);

    return NextResponse.json(fuelConsumption);
  } catch (error) {
    return handleApiError(error, 'GET /api/reports/fuel-consumption', 'خطأ في تحميل التقرير');
  }
}
