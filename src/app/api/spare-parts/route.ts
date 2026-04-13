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

    const [parts, total] = await Promise.all([
      db.sparePart.findMany({
        where,
        include: {
          vehicle: { select: { sn: true, model: true, licencePlate: true } },
        },
        orderBy: { installDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.sparePart.count({ where }),
    ]);

    return NextResponse.json({
      parts,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    console.error('Spare parts error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل قطع الغيار' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      partName,
      quantity,
      unitCost,
      totalCost,
      supplier,
      installDate,
      installKm,
      expectedLife,
      notes,
    } = body;

    if (!vehicleId || !partName) {
      return NextResponse.json(
        { error: 'يرجى تعبئة الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const part = await db.sparePart.create({
      data: {
        vehicleId,
        partName,
        quantity: parseInt(quantity) || 1,
        unitCost: parseFloat(unitCost) || 0,
        totalCost: parseFloat(totalCost) || (parseFloat(unitCost) || 0) * (parseInt(quantity) || 1),
        supplier: supplier || '',
        installDate: installDate ? new Date(installDate) : new Date(),
        installKm: installKm ? parseFloat(installKm) : null,
        expectedLife: expectedLife || '',
        notes: notes || '',
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Create spare part error:', error);
    return NextResponse.json({ error: 'خطأ في إضافة قطعة الغيار' }, { status: 500 });
  }
}
