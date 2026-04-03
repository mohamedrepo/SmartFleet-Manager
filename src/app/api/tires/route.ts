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

    const [tires, total] = await Promise.all([
      db.tire.findMany({
        where,
        include: {
          vehicle: { select: { sn: true, model: true, licencePlate: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.tire.count({ where }),
    ]);

    return NextResponse.json({
      tires,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Tires error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل بيانات الإطارات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      position,
      brand,
      size,
      installKm,
      currentKm,
      maxKm,
      status,
      installDate,
    } = body;

    if (!vehicleId || !position) {
      return NextResponse.json(
        { error: 'يرجى تعبئة الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const tire = await db.tire.create({
      data: {
        vehicleId,
        position,
        brand: brand || '',
        size: size || '',
        installKm: parseFloat(installKm) || 0,
        currentKm: parseFloat(currentKm) || parseFloat(installKm) || 0,
        maxKm: maxKm ? parseFloat(maxKm) : null,
        status: status || 'active',
        installDate: installDate ? new Date(installDate) : new Date(),
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
    });

    return NextResponse.json(tire, { status: 201 });
  } catch (error) {
    console.error('Create tire error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الإطار' }, { status: 500 });
  }
}
