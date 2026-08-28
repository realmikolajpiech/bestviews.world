import { NextRequest, NextResponse } from 'next/server';

type PhotonProperties = {
  name?: string;
  city?: string;
  locality?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  osm_type?: string;
  osm_value?: string;
  osm_id?: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

type PhotonResponse = { features?: PhotonFeature[] };

const namedPlaceTypes = new Set(['city', 'town', 'village', 'municipality', 'state', 'county', 'region', 'locality', 'district']);
const photonLanguages = new Set(['de', 'en', 'fr']);

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    const value = part?.trim();
    if (!value || seen.has(value.toLocaleLowerCase())) return false;
    seen.add(value.toLocaleLowerCase());
    return true;
  });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (query.length < 3 || query.length > 120) {
    return NextResponse.json({ suggestions: [] });
  }

  const baseUrl = process.env.PHOTON_BASE_URL || 'https://photon.komoot.io';
  const url = new URL('/api', baseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '6');

  const requestedLanguage = request.headers.get('accept-language')?.match(/[a-z]{2}/i)?.[0]?.toLowerCase() || 'en';
  const language = photonLanguages.has(requestedLanguage) ? requestedLanguage : 'en';
  url.searchParams.set('lang', language);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BestViews.world/1.0 (support@mikolajpiech.com)' },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return NextResponse.json({ error: 'Location search unavailable' }, { status: 503 });

    const data = await response.json() as PhotonResponse;
    const suggestions = (data.features || []).flatMap((feature) => {
      const [longitude, latitude] = feature.geometry?.coordinates || [];
      const properties = feature.properties || {};
      const region = properties.osm_value && namedPlaceTypes.has(properties.osm_value)
        ? properties.name
        : properties.city || properties.locality || properties.district
          || properties.county || properties.state || properties.name;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !region || !properties.country) return [];

      const labelParts = uniqueParts([
        properties.name,
        properties.city || properties.locality || properties.district,
        properties.state,
        properties.country,
      ]);
      const name = labelParts[0] || region;
      return [{
        id: `${properties.osm_type || 'place'}-${properties.osm_id || `${latitude}-${longitude}`}`,
        name,
        context: labelParts.slice(1).join(', '),
        label: labelParts.join(', '),
        region,
        country: properties.country,
        latitude,
        longitude,
      }];
    });

    return NextResponse.json(
      { suggestions },
      { headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        Vary: 'Accept-Language',
      } },
    );
  } catch {
    return NextResponse.json({ error: 'Location search unavailable' }, { status: 503 });
  }
}
