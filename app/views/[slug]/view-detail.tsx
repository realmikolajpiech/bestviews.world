'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { User } from '@supabase/supabase-js';
import { Bookmark, CalendarDays, Check, Clock3, Compass, Footprints, MapPin, Navigation, Search, Share2, Sun, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import AuthDialog from '../../auth-dialog';
import AppNavigation from '../../app-navigation';
import SiteBrand from '../../site-brand';
import { getSupabaseBrowserClient } from '../../supabase';
import type { Viewpoint } from '../../view-data';

const ViewpointMap = dynamic(() => import('../../maplibre-map').then((module) => module.ViewpointMap), { ssr: false });

type Tip = { id: string; body: string; status: string; author: string };

function capturedAtLabel(localDateTime: string) {
  const [date, time] = localDateTime.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const dateLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(value);
  const timeLabel = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(value);
  return `${dateLabel} · ${timeLabel}`;
}

function mapTips(data: Record<string, unknown>[] | null): Tip[] {
  return (data || []).map((row) => {
    const profileValue = row.profiles;
    const profile = Array.isArray(profileValue) ? profileValue[0] : profileValue;
    return { id: String(row.id), body: String(row.body), status: String(row.status), author: profile && typeof profile === 'object' && 'display_name' in profile ? String(profile.display_name) : 'Traveler' };
  });
}

export default function ViewDetail({ view }: { view: Viewpoint }) {
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipBody, setTipBody] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2200); };
  const loadTips = async () => {
    const { data } = await getSupabaseBrowserClient().from('tips').select('id, body, status, profiles!tips_author_id_fkey(display_name)').eq('viewpoint_id', view.id).order('created_at', { ascending: false });
    setTips(mapTips(data));
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const applyUser = (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) { setSaved(false); setVisited(false); }
    };
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null));
    void supabase.from('tips').select('id, body, status, profiles!tips_author_id_fkey(display_name)').eq('viewpoint_id', view.id).order('created_at', { ascending: false }).then(({ data: tipRows }) => setTips(mapTips(tipRows)));
    return () => data.subscription.unsubscribe();
  }, [view.id]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.from('saves').select('viewpoint_id').eq('user_id', user.id).eq('viewpoint_id', view.id).maybeSingle(),
      supabase.from('visits').select('viewpoint_id').eq('user_id', user.id).eq('viewpoint_id', view.id).maybeSingle(),
    ]).then(([saveResult, visitResult]) => { setSaved(Boolean(saveResult.data)); setVisited(Boolean(visitResult.data)); });
  }, [user, view.id]);

  const requireUser = (action: () => void) => user ? action() : setAuthOpen(true);
  const toggleSaved = () => requireUser(() => {
    if (!user) return;
    const next = !saved; setSaved(next);
    const request = next
      ? getSupabaseBrowserClient().from('saves').upsert({ user_id: user.id, viewpoint_id: view.id })
      : getSupabaseBrowserClient().from('saves').delete().eq('user_id', user.id).eq('viewpoint_id', view.id);
    void request.then(({ error }) => { if (error) setSaved(!next); else notify(next ? 'Saved for later' : 'Removed from saved'); });
  });
  const toggleVisited = () => requireUser(() => {
    if (!user) return;
    const next = !visited; setVisited(next);
    const request = next
      ? getSupabaseBrowserClient().from('visits').upsert({ user_id: user.id, viewpoint_id: view.id })
      : getSupabaseBrowserClient().from('visits').delete().eq('user_id', user.id).eq('viewpoint_id', view.id);
    void request.then(({ error }) => { if (error) setVisited(!next); else notify(next ? 'Added to your map' : 'Removed from your map'); });
  });
  const addTip = () => requireUser(() => {
    if (!user || tipBody.trim().length < 4) return;
    void getSupabaseBrowserClient().from('tips').insert({ viewpoint_id: view.id, author_id: user.id, body: tipBody.trim(), status: 'approved' }).then(({ error }) => {
      if (error) notify('Could not submit the tip');
      else { setTipBody(''); notify('Tip posted'); void loadTips(); }
    });
  });
  const share = async () => {
    if (navigator.share) await navigator.share({ title: view.title, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); notify('Link copied'); }
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.coordinates)}`;
  const viewerAvatar = user && (user.user_metadata.avatar_url || user.user_metadata.picture);
  return (
    <main className="view-screen">
      <header className="view-screen-header site-topbar app-page-topbar">
        <SiteBrand />
        <AppNavigation />
        <div className="topbar-tools">
          <Link className="compact-search topbar-search" href="/?search=1"><Search size={16} /><span>Search views</span></Link>
          <nav className="view-header-actions" aria-label="View navigation">
            <button type="button" className="view-share" onClick={() => void share()}><Share2 size={16} /><span>Share</span></button>
            {user ? (
              <Link className="avatar view-header-avatar" href="/profile" aria-label="Open your profile">
                {typeof viewerAvatar === 'string' && viewerAvatar ? <img src={viewerAvatar} alt="" /> : (user.user_metadata.full_name || user.email || 'T').charAt(0).toUpperCase()}
              </Link>
            ) : (
              <button className="avatar view-header-avatar" type="button" aria-label="Sign in" onClick={() => setAuthOpen(true)}><UserRound size={18} /></button>
            )}
          </nav>
        </div>
      </header>

      <div className="view-stage">
        <section className="view-photo" style={{ backgroundImage: `url('${view.image}')` }} aria-label={`View from ${view.title}`}><div className="view-photo-shade" /></section>
        <aside className="view-panel">
          <div className="view-identity">
            <p><MapPin size={13} /> {view.region}, {view.country}</p>
            <h1>{view.title}</h1>
            {view.contributor && (
              <Link className="view-contributor" href={`/profile/${view.contributor.id}`} aria-label={`View ${view.contributor.name}'s profile`}>
                <span className={view.contributor.avatar ? 'has-image' : ''} style={view.contributor.avatar ? { backgroundImage: `url('${view.contributor.avatar}')` } : undefined}>
                  {!view.contributor.avatar && view.contributor.name.charAt(0).toUpperCase()}
                </span>
                <small>Shared by {view.contributor.name}</small>
              </Link>
            )}
          </div>

          <div className="view-primary-actions">
            <button className={saved ? 'active' : ''} type="button" onClick={toggleSaved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /><span>{saved ? 'Saved' : 'Save'}</span></button>
            <button className={visited ? 'active visited' : ''} type="button" onClick={toggleVisited}><Check size={17} /><span>{visited ? 'Been here' : 'Been here?'}</span></button>
            <a href={directions} target="_blank" rel="noreferrer"><Navigation size={17} /><span>Directions</span></a>
          </div>

          <section className="stand-panel">
            <div className="stand-panel-head"><h2>Stand here</h2></div>
            <div className="stand-mini-map"><ViewpointMap coordinate={{ latitude: view.latitude, longitude: view.longitude }} ariaLabel={`Exact viewpoint for ${view.title}`} /><small>{view.coordinates}</small></div>
          </section>

          <section className="view-facts" aria-label="Useful details about this view">
            {view.capturedAtLocal && <div><span><small><CalendarDays /> {view.captureTimeSource === 'file' ? 'File dated' : 'Photographed'}</small><strong>{capturedAtLabel(view.capturedAtLocal)}</strong></span></div>}
            {view.bestTime && <div><span><small><Clock3 /> Best light</small><strong>{view.bestTime}</strong></span></div>}
            {view.accessSummary && <div><span><small><Footprints /> Getting there</small><strong>{view.accessSummary}</strong></span></div>}
            {view.difficulty && <div><span><small><Compass /> Effort</small><strong>{view.difficulty}</strong></span></div>}
          </section>

          {view.description && <p className="view-plain-description">{view.description}</p>}
          {view.tip && <section className="one-tip"><Sun size={18} /><div><small>Before you go</small><p>{view.tip}</p></div></section>}

          <section className="community-tip-section">
            <h2>Tips from people who stood here</h2>
            {tips.map((tip) => <article key={tip.id}><strong>{tip.author}</strong><p>{tip.body}</p></article>)}
            {!tips.length && <p>No community tips yet.</p>}
            <div><input value={tipBody} onChange={(event) => setTipBody(event.target.value)} maxLength={280} placeholder="Add one useful detail" /><button type="button" onClick={addTip}>Add tip</button></div>
          </section>
        </aside>
      </div>

      {authOpen && <AuthDialog context="view" onClose={() => setAuthOpen(false)} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
