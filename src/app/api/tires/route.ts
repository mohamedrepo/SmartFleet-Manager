import { db } from '@/lib/db';
import { handleApiError, ApiError } from '@/lib/api-error';
import { createTireSchema } from '@/lib/validation-schemas';
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
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/tires', 'خطأ في تحميل بيانات الإطارات');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTireSchema.parse(body);

    // Verify vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: validated.vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new ApiError(404, 'المركبة المحددة غير موجودة');
    }

    const tire = await db.tire.create({
      data: {
        vehicleId: validated.vehicleId,
        position: validated.position,
        brand: validated.brand,
        size: validated.size,
        installKm: validated.installKm,
        currentKm: validated.currentKm,
        maxKm: validated.maxKm,
        status: validated.status,
        installDate: new Date(),
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
    });

    return NextResponse.json(tire, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/tires', 'خطأ في إضافة الإطار');
  }
}
