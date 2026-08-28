import { publicPhotoUrl } from './supabase';

export const categories = ['For you', 'Sunsets', 'Mountains', 'City lights', 'Coastlines', 'Hidden gems'] as const;
export type ViewCategory = Exclude<(typeof categories)[number], 'For you'>;

export type Contributor = { id: string; name: string; avatar: string | null };

export type Viewpoint = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  region: string;
  country: string;
  category: ViewCategory;
  bestTime: string | null;
  bestSeason: string | null;
  difficulty: string | null;
  cost: string | null;
  accessSummary: string | null;
  coordinates: string;
  latitude: number;
  longitude: number;
  description: string | null;
  tip: string | null;
  image: string;
  thumb: string;
  contributor: Contributor | null;
  createdAt: string;
};

export type ViewpointRow = Record<string, unknown> & {
  id: string;
  slug: string;
  title: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  category: ViewCategory;
  cover_photo_path: string | null;
  created_at: string;
};

export function rowToViewpoint(row: ViewpointRow): Viewpoint {
  const profileValue = row.profiles;
  const profile = Array.isArray(profileValue) ? profileValue[0] : profileValue;
  const contributor = profile && typeof profile === 'object'
    ? profile as { id?: string; display_name?: string; avatar_url?: string | null }
    : null;
  const image = publicPhotoUrl(row.cover_photo_path) ?? '';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortTitle: String(row.short_title || row.title),
    region: row.region,
    country: row.country,
    category: row.category,
    bestTime: row.best_time ? String(row.best_time) : null,
    bestSeason: row.best_season ? String(row.best_season) : null,
    difficulty: row.difficulty ? String(row.difficulty) : null,
    cost: row.cost ? String(row.cost) : null,
    accessSummary: row.access_summary ? String(row.access_summary) : null,
    coordinates: `${Number(row.latitude).toFixed(6)}, ${Number(row.longitude).toFixed(6)}`,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    description: row.description ? String(row.description) : null,
    tip: row.tip ? String(row.tip) : null,
    image,
    thumb: image,
    contributor: contributor?.id ? {
      id: contributor.id,
      name: contributor.display_name || 'Community member',
      avatar: contributor.avatar_url || null,
    } : null,
    createdAt: row.created_at,
  };
}
