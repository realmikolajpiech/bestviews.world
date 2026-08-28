'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Camera, Check, ExternalLink, Heart, LoaderCircle, MapPin, Pencil, Plus, Search, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AuthDialog from '../auth-dialog';
import AppNavigation from '../app-navigation';
import HeaderProfileLink from '../header-profile-link';
import SiteBrand from '../site-brand';
import { getSupabaseBrowserClient } from '../supabase';
import { rowToViewpoint, type Viewpoint, type ViewpointRow } from '../view-data';

const ProfileMap = dynamic(() => import('../maplibre-map').then((module) => module.ExploreMap), { ssr: false });
const viewpointSelect = '*, profiles!viewpoints_contributor_id_fkey(id, display_name, avatar_url)';

type ProfileRecord = {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  social_url: string | null;
};
type ProfileStats = { followers: number; following: number };
type SharedView = { view: Viewpoint; status: string };
type ProfileTab = 'visited' | 'saved' | 'shared';

function avatarFrom(user: User, profile: ProfileRecord | null) {
  const value = profile?.avatar_url || user.user_metadata.avatar_url || user.user_metadata.picture;
  return typeof value === 'string' && value ? value : null;
}

function fallbackName(user: User) {
  return String(user.user_metadata.full_name || user.email?.split('@')[0] || 'Traveler');
}

function profileLinkLabel(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return 'Social link'; }
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
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0 });
  const avatarPreview = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : null, [avatarFile]);

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

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
        setStats({ followers: 0, following: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      const [profileResult, savesResult, visitsResult, sharedResult, followersResult, followingResult] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url, bio, location, social_url').eq('id', nextUser.id).maybeSingle(),
        supabase.from('saves').select('viewpoint_id, created_at').eq('user_id', nextUser.id).order('created_at', { ascending: false }),
        supabase.from('visits').select('viewpoint_id, visited_at').eq('user_id', nextUser.id).order('visited_at', { ascending: false }),
        supabase.from('viewpoints').select(viewpointSelect).eq('contributor_id', nextUser.id).order('created_at', { ascending: false }),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', nextUser.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', nextUser.id),
      ]);

      if (!active) return;
      const nextProfile = profileResult.data as ProfileRecord | null;
      setProfile(nextProfile);
      setName(nextProfile?.display_name || fallbackName(nextUser));
      setBio(nextProfile?.bio || '');
      setLocation(nextProfile?.location || '');
      setSocialUrl(nextProfile?.social_url || '');
      setStats({ followers: followersResult.count || 0, following: followingResult.count || 0 });

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
  const avatar = user ? avatarFrom(user, profile) : null;
  const visibleViews = useMemo(() => tab === 'visited' ? visitedViews : tab === 'saved' ? savedViews : sharedViews.map((item) => item.view), [tab, visitedViews, savedViews, sharedViews]);

  const resetEditor = () => {
    setName(profile?.display_name || (user ? fallbackName(user) : ''));
    setBio(profile?.bio || '');
    setLocation(profile?.location || '');
    setSocialUrl(profile?.social_url || '');
    setAvatarFile(null);
    setProfileError(null);
  };

  const saveProfile = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return setProfileError('Add the name you want people to see.');
    let normalizedSocialUrl: string | null = null;
    if (socialUrl.trim()) {
      try {
        const candidate = /^https?:\/\//i.test(socialUrl.trim()) ? socialUrl.trim() : `https://${socialUrl.trim()}`;
        const parsed = new URL(candidate);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported link');
        normalizedSocialUrl = parsed.toString();
      } catch {
        return setProfileError('Add a valid social or website link.');
      }
    }

    setSavingProfile(true);
    setProfileError(null);
    const supabase = getSupabaseBrowserClient();
    let nextAvatarUrl = profile?.avatar_url || avatarFrom(user, profile);
    if (avatarFile) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(avatarFile.type) || avatarFile.size > 4 * 1024 * 1024) {
        setSavingProfile(false);
        return setProfileError('Choose a JPG, PNG, or WebP image under 4 MB.');
      }
      const extension = avatarFile.type === 'image/png' ? 'png' : avatarFile.type === 'image/webp' ? 'webp' : 'jpg';
      const avatarPath = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from('profile-avatars').upload(avatarPath, avatarFile, { contentType: avatarFile.type, upsert: true });
      if (uploadError) {
        setSavingProfile(false);
        return setProfileError('Could not upload that profile picture.');
      }
      const { data } = supabase.storage.from('profile-avatars').getPublicUrl(avatarPath);
      nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    }

    const nextProfile: ProfileRecord = {
      display_name: trimmed,
      avatar_url: nextAvatarUrl || null,
      bio: bio.trim() || null,
      location: location.trim() || null,
      social_url: normalizedSocialUrl,
    };
    const { error } = await supabase.from('profiles').update(nextProfile).eq('id', user.id);
    if (!error) await supabase.auth.updateUser({ data: { full_name: trimmed } });
    setSavingProfile(false);
    if (error) setProfileError('Could not save your profile.');
    else {
      setProfile(nextProfile);
      setSocialUrl(normalizedSocialUrl || '');
      setAvatarFile(null);
      setEditing(false);
    }
  };

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.replace('/');
  };

  return (
    <main className="profile-page">
      <header className="profile-topbar site-topbar app-page-topbar">
        <SiteBrand />
        <AppNavigation />
        <div className="topbar-tools">
          <Link className="compact-search topbar-search" href="/?search=1"><Search size={16} /><span>Search views</span></Link>
          <nav className="profile-header-actions">
            <Link className="profile-share" href="/?share=1">Share a view <Plus size={16} /></Link>
            <HeaderProfileLink />
          </nav>
        </div>
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
          <section className={`profile-hero ${editing ? 'is-editing' : ''}`}>
            {editing ? (
              <label className="profile-inline-avatar" aria-label="Change profile picture">
                <span className={`profile-avatar ${avatarPreview || avatar ? 'has-image' : ''}`} style={avatarPreview || avatar ? { backgroundImage: `url('${avatarPreview || avatar}')` } : undefined}>
                  {!avatarPreview && !avatar && displayName.charAt(0).toUpperCase()}
                  <i><Camera size={16} /></i>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setAvatarFile(event.target.files?.[0] || null); setProfileError(null); }} />
              </label>
            ) : (
              <div className={`profile-avatar ${avatar ? 'has-image' : ''}`} style={avatar ? { backgroundImage: `url('${avatar}')` } : undefined}>{!avatar && displayName.charAt(0).toUpperCase()}</div>
            )}
            <div className="profile-intro">
              {editing ? (
                <div className="profile-inline-fields">
                  <input className="profile-inline-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoFocus aria-label="Display name" />
                  <textarea className="profile-inline-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={2} placeholder="Share a little about yourself and the views you chase." aria-label="Bio" />
                  <div className="profile-inline-meta">
                    <label><MapPin size={14} /><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={100} placeholder="Add location" aria-label="Location" /></label>
                    <label><ExternalLink size={14} /><input value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} maxLength={500} placeholder="Add social or website link" aria-label="Social or website link" /></label>
                  </div>
                  {profileError && <p className="profile-inline-error" role="alert">{profileError}</p>}
                </div>
              ) : (
                <>
                  <div className="profile-name-line"><h1>{displayName}</h1></div>
                  {profile?.bio
                    ? <p className="profile-bio">{profile.bio}</p>
                    : <button className="profile-add-bio" type="button" onClick={() => { resetEditor(); setEditing(true); }}>+ Add a bio</button>}
                  <div className="profile-meta">
                    {profile?.location && <span><MapPin size={14} /> {profile.location}</span>}
                    {profile?.social_url && <a href={profile.social_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {profileLinkLabel(profile.social_url)}</a>}
                  </div>
                </>
              )}
              <div className="profile-social-stats">
                <span><strong>{stats.followers}</strong><small>{stats.followers === 1 ? 'Follower' : 'Followers'}</small></span>
                <span><strong>{stats.following}</strong><small>Following</small></span>
                <span><strong>{sharedViews.filter((item) => item.status === 'published').length}</strong><small>Shared</small></span>
              </div>
            </div>
            <div className="profile-owner-actions">
              {editing ? (
                <>
                  <button className="profile-save-profile" type="button" onClick={() => void saveProfile()} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save'}</button>
                  <button className="profile-cancel-edit" type="button" onClick={() => { resetEditor(); setEditing(false); }}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="profile-edit-profile" type="button" onClick={() => { resetEditor(); setEditing(true); }}><Pencil size={15} /> Edit profile</button>
                  <button className="profile-signout" type="button" onClick={() => void signOut()}>Sign out</button>
                </>
              )}
            </div>
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
            <EmptyProfileSection title="Nothing waiting for you yet." action="Explore views" href="/" />
          ) : (
            <EmptyProfileSection title="Share the first place that stayed with you." action="Share a view" href="/?share=1" />
          )}
        </div>
      )}

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </main>
  );
}
