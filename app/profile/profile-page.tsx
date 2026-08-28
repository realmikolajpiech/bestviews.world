'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, Check, Heart, LoaderCircle, MapPin, Pencil, Plus, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AuthDialog from '../auth-dialog';
import { getSupabaseBrowserClient } from '../supabase';
import { rowToViewpoint, type Viewpoint, type ViewpointRow } from '../view-data';

const ProfileMap = dynamic(() => import('../maplibre-map').then((module) => module.ExploreMap), { ssr: false });
const viewpointSelect = '*, profiles!viewpoints_contributor_id_fkey(id, display_name, avatar_url)';

type ProfileRecord = { display_name: string; avatar_url: string | null };
type SharedView = { view: Viewpoint; status: string };
type ProfileTab = 'visited' | 'saved' | 'shared';

function avatarFrom(user: User, profile: ProfileRecord | null) {
  const value = profile?.avatar_url || user.user_metadata.avatar_url || user.user_metadata.picture;
  return typeof value === 'string' && value ? value : null;
}

function fallbackName(user: User) {
  return String(user.user_metadata.full_name || user.email?.split('@')[0] || 'Traveler');
}

function ViewCard({ view, note }: { view: Viewpoint; note?: string }) {
  return (
    <article className="profile-view-card">
      <Link href={`/views/${view.slug}`} className="profile-view-photo" style={view.image ? { backgroundImage: `url('${view.image}')` } : undefined}>
        {note && <span>{note}</span>}
      </Link>
      <div>
        <h2><Link href={`/views/${view.slug}`}>{view.title}</Link></h2>
        <p><MapPin size={14} /> {view.region}, {view.country}</p>
      </div>
    </article>
  );
}

function EmptyProfileSection({ title, action, href }: { title: string; action: string; href: string }) {
  return (
    <div className="profile-empty">
      <span><MapPin size={24} /></span>
      <h2>{title}</h2>
      <Link href={href}>{action}</Link>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [savedViews, setSavedViews] = useState<Viewpoint[]>([]);
  const [visitedViews, setVisitedViews] = useState<Viewpoint[]>([]);
  const [sharedViews, setSharedViews] = useState<SharedView[]>([]);
  const [selectedView, setSelectedView] = useState<Viewpoint | null>(null);
  const [tab, setTab] = useState<ProfileTab>('visited');
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    const loadProfile = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setSavedViews([]);
        setVisitedViews([]);
        setSharedViews([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [profileResult, savesResult, visitsResult, sharedResult] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('id', nextUser.id).maybeSingle(),
        supabase.from('saves').select('viewpoint_id, created_at').eq('user_id', nextUser.id).order('created_at', { ascending: false }),
        supabase.from('visits').select('viewpoint_id, visited_at').eq('user_id', nextUser.id).order('visited_at', { ascending: false }),
        supabase.from('viewpoints').select(viewpointSelect).eq('contributor_id', nextUser.id).order('created_at', { ascending: false }),
      ]);

      if (!active) return;
      const nextProfile = profileResult.data as ProfileRecord | null;
      setProfile(nextProfile);
      setName(nextProfile?.display_name || fallbackName(nextUser));

      const savedIds = (savesResult.data || []).map((row) => String(row.viewpoint_id));
      const visitedIds = (visitsResult.data || []).map((row) => String(row.viewpoint_id));
      const personalIds = Array.from(new Set([...savedIds, ...visitedIds]));
      const personalResult = personalIds.length
        ? await supabase.from('viewpoints').select(viewpointSelect).in('id', personalIds)
        : { data: [], error: null };

      if (!active) return;
      const byId = new Map((personalResult.data || []).map((row) => {
        const view = rowToViewpoint(row as ViewpointRow);
        return [view.id, view] as const;
      }));
      const nextSaved = savedIds.map((id) => byId.get(id)).filter((view): view is Viewpoint => Boolean(view));
      const nextVisited = visitedIds.map((id) => byId.get(id)).filter((view): view is Viewpoint => Boolean(view));
      const nextShared = (sharedResult.data || []).map((row) => ({
        view: rowToViewpoint(row as ViewpointRow),
        status: String((row as Record<string, unknown>).status || 'pending'),
      }));

      setSavedViews(nextSaved);
      setVisitedViews(nextVisited);
      setSharedViews(nextShared);
      setSelectedView(nextVisited[0] || null);
      setLoading(false);
    };

    void supabase.auth.getUser().then(({ data }) => loadProfile(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { void loadProfile(session?.user ?? null); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const displayName = profile?.display_name || (user ? fallbackName(user) : 'Your views');
  const firstName = displayName.split(/\s+/)[0];
  const avatar = user ? avatarFrom(user, profile) : null;
  const visibleViews = useMemo(() => tab === 'visited' ? visitedViews : tab === 'saved' ? savedViews : sharedViews.map((item) => item.view), [tab, visitedViews, savedViews, sharedViews]);

  const saveName = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return setNameError('Add the name you want people to see.');
    setSavingName(true);
    setNameError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', user.id);
    if (!error) await supabase.auth.updateUser({ data: { full_name: trimmed } });
    setSavingName(false);
    if (error) setNameError('Could not save that name.');
    else { setProfile((current) => ({ display_name: trimmed, avatar_url: current?.avatar_url || null })); setEditing(false); }
  };

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.replace('/');
  };

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <Link className="profile-brand" href="/"><img src="/bestviews-logo.png" alt="" /><span>BestViews<span>.world</span></span></Link>
        <nav>
          <Link href="/"><ArrowLeft size={17} /> Discover</Link>
          {user && <Link className="profile-share" href="/?share=1">Share a view <Plus size={16} /></Link>}
        </nav>
      </header>

      {loading ? (
        <div className="profile-loading" aria-label="Loading your views"><LoaderCircle /></div>
      ) : !user ? (
        <section className="profile-signed-out">
          <span><UserRound size={28} /></span>
          <h1>Your views live here.</h1>
          <button type="button" onClick={() => setAuthOpen(true)}>Sign in</button>
        </section>
      ) : (
        <div className="profile-content">
          <section className="profile-hero">
            <div className={`profile-avatar ${avatar ? 'has-image' : ''}`} style={avatar ? { backgroundImage: `url('${avatar}')` } : undefined}>{!avatar && displayName.charAt(0).toUpperCase()}</div>
            <div className="profile-intro">
              {editing ? (
                <div className="profile-name-edit">
                  <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoFocus aria-label="Display name" />
                  <button type="button" onClick={() => void saveName()} disabled={savingName}>{savingName ? 'Saving…' : 'Save'}</button>
                  <button type="button" onClick={() => { setEditing(false); setName(displayName); setNameError(null); }}>Cancel</button>
                  {nameError && <p role="alert">{nameError}</p>}
                </div>
              ) : (
                <>
                  <div className="profile-name-line"><h1>{firstName}’s views</h1><button type="button" onClick={() => setEditing(true)} aria-label="Edit your name"><Pencil size={16} /></button></div>
                  <p>Places that stayed with you.</p>
                </>
              )}
            </div>
            <button className="profile-signout" type="button" onClick={() => void signOut()}>Sign out</button>
          </section>

          <nav className="profile-tabs" aria-label="Your views">
            <button className={tab === 'visited' ? 'active' : ''} type="button" onClick={() => setTab('visited')}><Check size={16} /> Been there</button>
            <button className={tab === 'saved' ? 'active' : ''} type="button" onClick={() => setTab('saved')}><Heart size={16} /> Saved</button>
            <button className={tab === 'shared' ? 'active' : ''} type="button" onClick={() => setTab('shared')}><Plus size={16} /> Shared</button>
          </nav>

          {tab === 'visited' && visitedViews.length > 0 && selectedView && (
            <section className="profile-map-section">
              <div className="profile-map-copy"><h2>Your map</h2><p>{selectedView.title}<span>{selectedView.region}, {selectedView.country}</span></p></div>
              <div className="profile-map"><ProfileMap viewpoints={visitedViews} selected={selectedView} onSelect={setSelectedView} ariaLabel="Map of views you have experienced" /></div>
            </section>
          )}

          {visibleViews.length ? (
            <section className="profile-view-grid">
              {tab === 'shared'
                ? sharedViews.map(({ view, status }) => <ViewCard key={view.id} view={view} note={status === 'published' ? undefined : status === 'pending' ? 'Waiting for review' : status === 'draft' ? 'Draft' : 'Needs another look'} />)
                : visibleViews.map((view) => <ViewCard key={view.id} view={view} />)}
            </section>
          ) : tab === 'visited' ? (
            <EmptyProfileSection title="Your map is still open." action="Find a view" href="/" />
          ) : tab === 'saved' ? (
            <EmptyProfileSection title="Nothing waiting for you yet." action="Discover views" href="/" />
          ) : (
            <EmptyProfileSection title="Share the first place that stayed with you." action="Share a view" href="/?share=1" />
          )}
        </div>
      )}

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </main>
  );
}
