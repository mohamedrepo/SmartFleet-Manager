import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [workOrders, total] = await Promise.all([
      db.workOrder.findMany({
        where,
        include: {
          vehicle: { select: { sn: true, model: true, licencePlate: true, branch: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.workOrder.count({ where }),
    ]);

    return NextResponse.json({
      workOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Work orders error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل أوامر الشغل' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      driverName,
      distributor,
      departureBranch,
      destinationBranch,
      branch,
      departureKm,
      stops,
      estimatedDistance,
      estimatedTime,
      estimatedArrival,
      estimatedDurationMin,
      status,
      notes,
    } = body;

    if (!vehicleId || !driverName) {
      return NextResponse.json(
        { error: 'يرجى تعبئة الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const maxOrder = await db.workOrder.findFirst({
      orderBy: { orderNo: 'desc' },
      select: { orderNo: true },
    });

    const nextOrderNo = (maxOrder?.orderNo || 0) + 1;

    const workOrder = await db.workOrder.create({
      data: {
        orderNo: nextOrderNo,
        vehicleId,
        driverName,
        distributor: distributor || '',
        departureBranch: departureBranch || '',
        destinationBranch: destinationBranch || '',
        branch: branch || destinationBranch || '',
        departureKm: parseFloat(departureKm) || 0,
        stops: typeof stops === 'string' ? stops : JSON.stringify(stops || []),
        estimatedDistance: parseFloat(estimatedDistance) || 0,
        estimatedTime: estimatedTime || '',
        estimatedArrival: estimatedArrival || '',
        status: status || 'open',
        notes: notes || '',
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true, branch: true } },
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Create work order error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء أمر الشغل' }, { status: 500 });
  }
}
