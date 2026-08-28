import ExploreApp from './explore-app';
import { getPublishedViewpoints } from './supabase-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const viewpoints = await getPublishedViewpoints();
  return <ExploreApp initialViewpoints={viewpoints} />;
}
