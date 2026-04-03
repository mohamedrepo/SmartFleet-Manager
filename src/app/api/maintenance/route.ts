import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const [records, total] = await Promise.all([
      db.maintenanceRecord.findMany({
        where,
        include: {
          vehicle: { select: { sn: true, model: true, licencePlate: true } },
        },
        orderBy: { serviceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.maintenanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Maintenance error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل سجلات الصيانة' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      type,
      description,
      cost,
      kmAtService,
      nextServiceKm,
      serviceDate,
      provider,
      notes,
    } = body;

    if (!vehicleId || !type || !description) {
      return NextResponse.json(
        { error: 'يرجى تعبئة الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const record = await db.maintenanceRecord.create({
      data: {
        vehicleId,
        type,
        description,
        cost: parseFloat(cost) || 0,
        kmAtService: parseFloat(kmAtService) || 0,
        nextServiceKm: nextServiceKm ? parseFloat(nextServiceKm) : null,
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        provider: provider || '',
        notes: notes || '',
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create maintenance error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء سجل الصيانة' }, { status: 500 });
  }
}
