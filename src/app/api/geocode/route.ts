import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '8',
      'accept-language': 'ar',
      countrycodes: 'eg',
    });

    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'SmartFleetManager/1.0',
        },
      }
    );

    if (!resp.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await resp.json();
    const results = data.map((item: Record<string, string>) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      class: item.class,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ results: [] });
  }
}
