'use client';

import Link from 'next/link';
import { ArrowLeft, Check, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient, publicPhotoUrl } from '../supabase';

type PendingView = {
  id: string;
  title: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  cover_photo_path: string | null;
};

export default function ModerationPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [views, setViews] = useState<PendingView[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setAuthorized(false);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      const canModerate = profile?.role === 'moderator' || profile?.role === 'admin';
      setAuthorized(canModerate);
      if (!canModerate) return;
      const { data: pending } = await supabase.from('viewpoints').select('id,title,region,country,latitude,longitude,cover_photo_path').eq('status', 'pending').order('created_at');
      setViews((pending || []) as PendingView[]);
    });
  }, []);

  const decide = async (id: string, status: 'published' | 'rejected') => {
    const { error } = await getSupabaseBrowserClient().from('viewpoints').update({ status }).eq('id', id);
    if (!error) setViews((current) => current.filter((view) => view.id !== id));
  };

  if (authorized === null) return <main className="moderation-page"><p>Checking access…</p></main>;
  if (!authorized) return <main className="moderation-page"><Link href="/"><ArrowLeft size={16} /> Back</Link><h1>Moderation is private.</h1><p>Sign in with a moderator account to review community submissions.</p></main>;

  return (
    <main className="moderation-page">
      <Link href="/"><ArrowLeft size={16} /> Back to BestViews</Link>
      <header><h1>Views waiting for review</h1><p>{views.length ? `${views.length} community ${views.length === 1 ? 'submission' : 'submissions'}` : 'Everything is reviewed.'}</p></header>
      <div className="moderation-list">
        {views.map((view) => (
          <article key={view.id}>
            <span className="moderation-photo" style={{ backgroundImage: `url('${publicPhotoUrl(view.cover_photo_path) || ''}')` }} />
            <div><h2>{view.title}</h2><p><MapPin size={12} /> {view.region}, {view.country}</p><small>{view.latitude.toFixed(6)}, {view.longitude.toFixed(6)}</small></div>
            <nav><button type="button" onClick={() => void decide(view.id, 'published')}><Check size={15} /> Publish</button><button type="button" onClick={() => void decide(view.id, 'rejected')}><X size={15} /> Reject</button></nav>
          </article>
        ))}
      </div>
    </main>
  );
}
