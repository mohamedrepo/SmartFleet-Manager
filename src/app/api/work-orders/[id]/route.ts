import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.workOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'أمر الشغل غير موجود' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status: body.status || existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    };

    if (body.status === 'in_progress' && existing.status === 'open') {
      updateData.status = 'in_progress';
    }

    if (body.status === 'closed' && body.returnKm) {
      const returnKm = parseFloat(body.returnKm);
      const actualDistance = returnKm - existing.departureKm;
      const distanceDeviation = existing.estimatedDistance
        ? actualDistance - existing.estimatedDistance
        : 0;

      updateData.returnKm = returnKm;
      updateData.actualDistance = actualDistance;
      updateData.distanceDeviation = distanceDeviation;
      updateData.status = 'closed';
      updateData.returnDate = new Date();

      // Update vehicle km reading
      if (actualDistance > 0) {
        await db.vehicle.update({
          where: { id: existing.vehicleId },
          data: { kmReading: returnKm },
        });
      }
    }

    const workOrder = await db.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: { select: { sn: true, model: true, licencePlate: true } },
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Update work order error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث أمر الشغل' }, { status: 500 });
  }
}
