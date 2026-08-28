import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedViewpoint } from '../../supabase-data';
import ViewDetail from './view-detail';

type Props = { params: Promise<{ slug: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const view = await getPublishedViewpoint(slug);
  if (!view) return { title: 'View not found — BestViews.world', openGraph: { images: [] }, twitter: { images: [] } };
  const title = `${view.title} — BestViews.world`;
  const description = view.description || `See exactly where to stand for this view in ${view.region}, ${view.country}.`;
  return {
    title,
    description,
    openGraph: { title, description, images: view.image ? [{ url: view.image }] : [] },
    twitter: { card: 'summary_large_image', title, description, images: view.image ? [view.image] : [] },
  };
}

export default async function ViewPage({ params }: Props) {
  const { slug } = await params;
  const view = await getPublishedViewpoint(slug);
  if (!view) notFound();
  return <ViewDetail view={view} />;
}
