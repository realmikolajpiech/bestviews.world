'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, Bookmark, Check, Clock3, Compass, Footprints, MapPin, Navigation, Share2, Sun, X } from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../supabase';
import type { Viewpoint } from '../../view-data';

const ViewpointMap = dynamic(() => import('../../maplibre-map').then((module) => module.ViewpointMap), { ssr: false });

type Tip = { id: string; body: string; status: string; author: string };

function mapTips(data: Record<string, unknown>[] | null): Tip[] {
  return (data || []).map((row) => {
    const profileValue = row.profiles;
    const profile = Array.isArray(profileValue) ? profileValue[0] : profileValue;
    return { id: String(row.id), body: String(row.body), status: String(row.status), author: profile && typeof profile === 'object' && 'display_name' in profile ? String(profile.display_name) : 'Traveler' };
  });
}

function DetailAuth({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 190);
  };
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });
  const continueWith = async (provider: 'google' | 'facebook') => {
    setError(null);
    const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({ provider, options: { redirectTo: window.location.href } });
    if (authError) setError(authError.message);
  };
  return (
    <div className={`modal-backdrop ${closing ? 'is-closing' : ''}`} role="presentation" onMouseDown={requestClose}>
      <section className="auth-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={requestClose}><X size={18} /></button>
        <img src="/bestviews-logo.png" alt="" />
        <h2>Keep this view with you.</h2>
        <p>Sign in to save it, mark it visited, or leave a practical tip.</p>
        <div className="oauth-actions">
          <button type="button" onClick={() => void continueWith('google')}><FcGoogle className="oauth-logo" aria-hidden="true" />Continue with Google</button>
          <button type="button" onClick={() => void continueWith('facebook')}><FaFacebook className="oauth-logo facebook-logo" aria-hidden="true" />Continue with Facebook</button>
        </div>
        {error && <p className="submit-error">{error}</p>}
      </section>
    </div>
  );
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
    void getSupabaseBrowserClient().from('tips').insert({ viewpoint_id: view.id, author_id: user.id, body: tipBody.trim(), status: 'pending' }).then(({ error }) => {
      if (error) notify('Could not submit the tip');
      else { setTipBody(''); notify('Tip submitted for review'); void loadTips(); }
    });
  });
  const share = async () => {
    if (navigator.share) await navigator.share({ title: view.title, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); notify('Link copied'); }
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.coordinates)}`;
  return (
    <main className="view-screen">
      <header className="view-screen-header">
        <Link href="/" className="view-back"><ArrowLeft size={17} /> Discover</Link>
        <Link href="/" className="view-logo"><img className="brand-mark" src="/bestviews-logo.png" alt="" /><span>BestViews<span>.world</span></span></Link>
        <button type="button" className="view-share" onClick={() => void share()}><Share2 size={16} /><span>Share</span></button>
      </header>

      <div className="view-stage">
        <section className="view-photo" style={{ backgroundImage: `url('${view.image}')` }} aria-label={`View from ${view.title}`}><div className="view-photo-shade" /></section>
        <aside className="view-panel">
          <div className="view-identity">
            <p><MapPin size={13} /> {view.region}, {view.country}</p>
            <h1>{view.title}</h1>
            {view.contributor && <div className="view-contributor"><span>{view.contributor.name.charAt(0).toUpperCase()}</span><small>Shared by {view.contributor.name}</small></div>}
          </div>

          <div className="view-primary-actions">
            <button className={saved ? 'active' : ''} type="button" onClick={toggleSaved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /><span>{saved ? 'Saved' : 'Save'}</span></button>
            <button className={visited ? 'active visited' : ''} type="button" onClick={toggleVisited}><Check size={17} /><span>{visited ? 'Been here' : 'Been here?'}</span></button>
            <a href={directions} target="_blank" rel="noreferrer"><Navigation size={17} /><span>Directions</span></a>
          </div>

          <section className="stand-panel">
            <div className="stand-panel-head"><h2>Stand here</h2></div>
            <div className="stand-mini-map"><ViewpointMap coordinate={{ latitude: view.latitude, longitude: view.longitude }} ariaLabel={`Exact viewpoint for ${view.title}`} /><small>{view.coordinates}</small></div>
            <div className="stand-instruction"><Compass size={16} /><span><small>Look this way</small><strong>{view.lookDirection}</strong></span></div>
          </section>

          <section className="view-facts">
            {view.bestTime && <div><Clock3 /><span><small>Best time</small><strong>{view.bestTime}</strong></span></div>}
            {view.accessSummary && <div><Footprints /><span><small>From where</small><strong>{view.accessSummary}</strong></span></div>}
            {view.difficulty && <div><Compass /><span><small>Effort</small><strong>{view.difficulty}</strong></span></div>}
          </section>

          {view.description && <p className="view-plain-description">{view.description}</p>}
          {view.tip && <section className="one-tip"><Sun size={18} /><div><small>Before you go</small><p>{view.tip}</p></div></section>}

          <section className="community-tip-section">
            <h2>Tips from people who stood here</h2>
            {tips.map((tip) => <article key={tip.id}><strong>{tip.author}</strong><p>{tip.body}</p>{tip.status === 'pending' && <small>Pending review</small>}</article>)}
            {!tips.length && <p>No community tips yet.</p>}
            <div><input value={tipBody} onChange={(event) => setTipBody(event.target.value)} maxLength={280} placeholder="Add one useful detail" /><button type="button" onClick={addTip}>Add tip</button></div>
          </section>
        </aside>
      </div>

      {authOpen && <DetailAuth onClose={() => setAuthOpen(false)} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
