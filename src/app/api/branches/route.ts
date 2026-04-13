import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all branches
    const branches = await db.branch.findMany();
    
    // Get all vehicles grouped by branch
    const vehiclesByBranch = await db.vehicle.groupBy({
      by: ['branch'],
      _count: { id: true },
    });

    // Get current month for fuel calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all fuel transactions this month
    const fuelTransactions = await db.fuelTransaction.findMany({
      where: {
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
        type: 'D',
      },
      include: { vehicle: { select: { branch: true } } },
    });

    // Get maintenance records this month
    const maintenanceRecords = await db.maintenanceRecord.findMany({
      where: {
        serviceDate: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { vehicle: { select: { branch: true } } },
    });

    // Get work orders by branch
    const workOrders = await db.workOrder.findMany({
      include: { vehicle: { select: { branch: true } } },
    });

    // Aggregate data by branch
    const branchData: Record<string, any> = {};

    for (const branch of branches) {
      branchData[branch.name] = {
        id: branch.id,
        name: branch.name,
        latitude: branch.latitude,
        longitude: branch.longitude,
        address: branch.address,
        phoneNumber: branch.phoneNumber,
        managerName: branch.managerName,
        vehicleCount: 0,
        fuelCost: 0,
        maintenanceCost: 0,
        maintenanceCount: 0,
        openWorkOrders: 0,
        totalWorkOrders: 0,
      };
    }

    // Add vehicle counts
    for (const group of vehiclesByBranch) {
      if (branchData[group.branch]) {
        branchData[group.branch].vehicleCount = Number(group._count.id);
      }
    }

    // Add fuel data
    for (const transaction of fuelTransactions) {
      const branch = transaction.vehicle.branch;
      if (branchData[branch]) {
        branchData[branch].fuelCost += Number(transaction.amount);
      }
    }

    // Add maintenance data
    for (const maintenance of maintenanceRecords) {
      const branch = maintenance.vehicle.branch;
      if (branchData[branch]) {
        branchData[branch].maintenanceCost += Number(maintenance.cost);
        branchData[branch].maintenanceCount += 1;
      }
    }

    // Add work order data
    for (const workOrder of workOrders) {
      const branch = workOrder.vehicle.branch;
      if (branchData[branch]) {
        branchData[branch].totalWorkOrders += 1;
        if (['open', 'in_progress'].includes(workOrder.status)) {
          branchData[branch].openWorkOrders += 1;
        }
      }
    }

    // Convert to array and add calculated metrics
    const result = Object.values(branchData).map((branch: any) => ({
      ...branch,
      fuelCost: Math.round(branch.fuelCost),
      maintenanceCost: Math.round(branch.maintenanceCost),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'GET /api/branches', 'خطأ في تحميل بيانات الفروع');
  }
}
