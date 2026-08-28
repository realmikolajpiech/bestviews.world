import { createSupabaseServerClient } from './supabase';
import { rowToViewpoint, type Viewpoint, type ViewpointRow } from './view-data';

const viewpointSelect = '*, profiles!viewpoints_contributor_id_fkey(id, username, display_name, avatar_url)';

export async function getPublishedViewpoints(): Promise<Viewpoint[]> {
  try {
    const { data, error } = await createSupabaseServerClient()
      .from('viewpoints')
      .select(viewpointSelect)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as ViewpointRow[]).map(rowToViewpoint).filter((view) => view.image);
  } catch {
    return [];
  }
}

export async function getPublishedViewpoint(slug: string): Promise<Viewpoint | null> {
  try {
    const { data, error } = await createSupabaseServerClient()
      .from('viewpoints')
      .select(viewpointSelect)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error || !data) return null;
    return rowToViewpoint(data as ViewpointRow);
  } catch {
    return null;
  }
}
