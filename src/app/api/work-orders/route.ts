import { db } from '@/lib/db';
import { handleApiError, ApiError } from '@/lib/api-error';
import { createWorkOrderSchema, listQuerySchema } from '@/lib/validation-schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = listQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
    });

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;

    const [workOrders, total] = await Promise.all([
      db.workOrder.findMany({
        where,
        include: {
          vehicle: { select: { sn: true, model: true, licencePlate: true, branch: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      db.workOrder.count({ where }),
    ]);

    return NextResponse.json({
      workOrders,
      total: Number(total),
      page: params.page,
      totalPages: Math.ceil(Number(total) / params.limit),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/work-orders', 'خطأ في تحميل أوامر الشغل');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createWorkOrderSchema.parse(body);

    // Verify vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: validated.vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new ApiError(404, 'المركبة المحددة غير موجودة');
    }

    // Get next order number
    const maxOrder = await db.workOrder.findFirst({
      orderBy: { orderNo: 'desc' },
      select: { orderNo: true },
    });

    const nextOrderNo = (maxOrder?.orderNo || 0) + 1;

    const workOrder = await db.workOrder.create({
      data: {
        orderNo: nextOrderNo,
        vehicleId: validated.vehicleId,
        driverName: validated.driverName,
        distributor: validated.distributor,
        departureBranch: validated.departureBranch,
        destinationBranch: validated.destinationBranch,
        branch: validated.branch || validated.destinationBranch || '',
        departureKm: validated.departureKm,
        stops: validated.stops,
        estimatedDistance: validated.estimatedDistance,
        estimatedFuel: validated.estimatedFuel || 0,
        estimatedTime: validated.estimatedTime,
        estimatedArrival: validated.estimatedArrival,
        status: validated.status,
        notes: validated.notes,
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true, branch: true } },
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/work-orders', 'خطأ في إنشاء أمر الشغل');
  }
}
