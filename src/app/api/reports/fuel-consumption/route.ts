import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get fuel consumption: km per liter for each vehicle
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
        _count: {
          select: { fuelTransactions: true },
        },
      },
    });

    const fuelConsumption = await Promise.all(
      vehicles.map(async (v) => {
        const purchases = await db.fuelTransaction.aggregate({
          _sum: { amount: true },
          where: { vehicleId: v.id, type: 'D' },
        });

        const totalPurchases = purchases._sum.amount || 0;
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
          totalFuelCost: Math.round(totalPurchases),
          estimatedLiters: Math.round(estimatedLiters),
          kmPerLiter: Math.round(kmPerLiter * 100) / 100,
          fuelRate: v.fuelRate,
          transactionCount: v._count.fuelTransactions,
        };
      })
    );

    fuelConsumption.sort((a, b) => b.totalFuelCost - a.totalFuelCost);

    return NextResponse.json(fuelConsumption);
  } catch (error) {
    console.error('Fuel consumption report error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل التقرير' }, { status: 500 });
  }
}
