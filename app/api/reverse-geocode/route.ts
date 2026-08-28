import { NextRequest, NextResponse } from 'next/server';

type NominatimAddress = Record<string, string | undefined>;
type NominatimResult = { address?: NominatimAddress; display_name?: string };

let lookupQueue = Promise.resolve();
let nextLookupAt = 0;

function fetchPlace(url: URL, acceptLanguage: string) {
  const lookup = lookupQueue.then(async () => {
    const waitMs = Math.max(0, nextLookupAt - Date.now());
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    nextLookupAt = Date.now() + 1100;
    return fetch(url, {
      headers: {
        'Accept-Language': acceptLanguage,
        'User-Agent': 'BestViews.world/1.0 (support@mikolajpiech.com)',
      },
      next: { revalidate: 86400 },
    });
  });
  lookupQueue = lookup.then(() => undefined, () => undefined);
  return lookup;
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get('lat'));
  const longitude = Number(request.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const baseUrl = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
  const url = new URL('/reverse', baseUrl);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', latitude.toFixed(5));
  url.searchParams.set('lon', longitude.toFixed(5));
  url.searchParams.set('zoom', '10');
  url.searchParams.set('layer', 'address');
  url.searchParams.set('addressdetails', '1');

  try {
    const response = await fetchPlace(url, request.headers.get('accept-language') || 'en');
    if (!response.ok) return NextResponse.json({ error: 'Place lookup unavailable' }, { status: 503 });
    const result = await response.json() as NominatimResult;
    const address = result.address || {};
    const region = address.city || address.town || address.village || address.hamlet
      || address.municipality || address.suburb || address.city_district || address.county
      || address.state_district || address.state || address.province
      || result.display_name?.split(',')[0]?.trim() || address.country;
    if (!region || !address.country) return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    return NextResponse.json(
      { region, country: address.country },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    );
  } catch {
    return NextResponse.json({ error: 'Place lookup unavailable' }, { status: 503 });
  }
}
