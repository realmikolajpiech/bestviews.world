import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getViewpoint, viewpoints } from '../../view-data';
import ViewDetail from './view-detail';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return viewpoints.map((view) => ({ slug: view.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const view = getViewpoint(slug);
  if (!view) return { title: 'View not found — BestViews.world' };
  const title = `${view.title} — Exact viewpoint | BestViews.world`;
  const description = `${view.description} See exactly where to stand, when to visit, and how to get there.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: view.image }] },
    twitter: { card: 'summary_large_image', title, description, images: [view.image] },
  };
}

export default async function ViewPage({ params }: Props) {
  const { slug } = await params;
  const view = getViewpoint(slug);
  if (!view) notFound();
  return <ViewDetail view={view} />;
}
