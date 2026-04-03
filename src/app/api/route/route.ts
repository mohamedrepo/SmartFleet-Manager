import { NextRequest, NextResponse } from 'next/server';

interface RoutePoint {
  lat: number;
  lon: number;
  name: string;
}

interface SegmentResult {
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  type: 'outbound' | 'return';
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h} س ${m} د` : `${m} د`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      points: RoutePoint[];
      returnPoint?: RoutePoint;
    };

    const { points, returnPoint } = body;

    if (!points || points.length < 2) {
      return NextResponse.json({ error: 'يجب إدخال نقطتين على الأقل' }, { status: 400 });
    }

    const ROAD_FACTOR = 1.35;
    const AVG_SPEED_KMH = 50;

    const segments: SegmentResult[] = [];
    let outboundDistance = 0;
    let outboundDuration = 0;
    let returnDistance = 0;
    let returnDuration = 0;

    // Calculate outbound segments
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];

      const straightDist = haversineDistance(from.lat, from.lon, to.lat, to.lon);
      const roadDist = straightDist * ROAD_FACTOR;
      const distKm = Math.round(roadDist * 10) / 10;
      const durMin = Math.round((roadDist / AVG_SPEED_KMH) * 60);

      outboundDistance += distKm;
      outboundDuration += durMin;

      segments.push({
        from: from.name,
        to: to.name,
        distanceKm: distKm,
        durationMin: durMin,
        type: 'outbound',
      });
    }

    // Calculate return segment (last stop → departure point)
    let returnSegment: SegmentResult | null = null;
    if (returnPoint && returnPoint.lat > 0 && returnPoint.lon > 0) {
      const lastStop = points[points.length - 1];
      // Only calculate return if the last stop is different from the return point
      const isSamePoint =
        Math.abs(lastStop.lat - returnPoint.lat) < 0.001 &&
        Math.abs(lastStop.lon - returnPoint.lon) < 0.001;

      if (!isSamePoint) {
        const straightDist = haversineDistance(lastStop.lat, lastStop.lon, returnPoint.lat, returnPoint.lon);
        const roadDist = straightDist * ROAD_FACTOR;
        const distKm = Math.round(roadDist * 10) / 10;
        const durMin = Math.round((roadDist / AVG_SPEED_KMH) * 60);

        returnDistance = distKm;
        returnDuration = durMin;

        returnSegment = {
          from: lastStop.name || 'نقطة الوصول',
          to: returnPoint.name || 'نقطة الانطلاق',
          distanceKm: distKm,
          durationMin: durMin,
          type: 'return',
        };
        segments.push(returnSegment);
      }
    }

    const totalDistance = Math.round((outboundDistance + returnDistance) * 10) / 10;
    const totalDuration = outboundDuration + returnDuration;

    const now = new Date();
    const arrival = new Date(now.getTime() + outboundDuration * 60000);
    const arrivalStr = arrival.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const returnArrival = new Date(now.getTime() + totalDuration * 60000);
    const returnArrivalStr = returnArrival.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return NextResponse.json({
      outboundDistance: Math.round(outboundDistance * 10) / 10,
      outboundDuration,
      outboundTime: formatDuration(outboundDuration),
      outboundArrival: arrivalStr,
      returnDistance: Math.round(returnDistance * 10) / 10,
      returnDuration,
      returnTime: formatDuration(returnDuration),
      returnArrival: returnArrivalStr,
      totalDistance,
      totalDuration,
      totalTime: formatDuration(totalDuration),
      totalArrival: returnArrivalStr,
      hasReturn: returnSegment !== null,
      segments,
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    return NextResponse.json({ error: 'خطأ في حساب المسار' }, { status: 500 });
  }
}
