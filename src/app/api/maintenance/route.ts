import { db } from '@/lib/db';
import { handleApiError, ApiError } from '@/lib/api-error';
import { createMaintenanceRecordSchema } from '@/lib/validation-schemas';
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
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/maintenance', 'خطأ في تحميل سجلات الصيانة');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createMaintenanceRecordSchema.parse(body);

    // Verify vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: validated.vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new ApiError(404, 'المركبة المحددة غير موجودة');
    }

    const record = await db.maintenanceRecord.create({
      data: {
        vehicleId: validated.vehicleId,
        type: validated.type,
        description: validated.description,
        cost: validated.cost,
        kmAtService: validated.kmAtService,
        nextServiceKm: validated.nextServiceKm,
        serviceDate: validated.serviceDate ? new Date(validated.serviceDate) : new Date(),
        provider: validated.provider,
        notes: validated.notes,
      },
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/maintenance', 'خطأ في إنشاء سجل الصيانة');
  }
}
