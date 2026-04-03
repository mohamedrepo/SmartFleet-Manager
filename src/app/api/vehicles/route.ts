import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get('branch');
    const type = searchParams.get('type');
    const fuel = searchParams.get('fuel');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (branch) where.branch = branch;
    if (type) where.type = type;
    if (fuel) where.fuel = fuel;
    if (search) {
      where.OR = [
        { licencePlate: { contains: search } },
        { model: { contains: search } },
        { chassisNo: { contains: search } },
        { cardName: { contains: search } },
        { cardNo: { contains: search } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        orderBy: { licenceNo: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      vehicles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Vehicles error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل المركبات' }, { status: 500 });
  }
}
