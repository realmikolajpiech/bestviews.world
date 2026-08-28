'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { User } from '@supabase/supabase-js';
import {
  ArrowUpRight,
  Bookmark,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Eye,
  Gem,
  Heart,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Mountain,
  Navigation,
  Plus,
  Search,
  Sparkles,
  Sunset,
  Upload,
  UserRound,
  Waves,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from './supabase';
import type { Coordinates } from './maplibre-map';
import { categories, type ViewCategory, type Viewpoint } from './view-data';

const ExploreMap = dynamic(() => import('./maplibre-map').then((module) => module.ExploreMap), { ssr: false });
const LocationPickerMap = dynamic(() => import('./maplibre-map').then((module) => module.LocationPickerMap), { ssr: false });

type Surface = 'explore' | 'map' | 'saved';
type SubmissionSummary = { title: string; status: string };

const categoryIcons = {
  'For you': Sparkles,
  Sunsets: Sunset,
  Mountains: Mountain,
  'City lights': Building2,
  Coastlines: Waves,
  'Hidden gems': Gem,
};

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="BestViews.world home">
      <img className="brand-mark" src="/bestviews-logo.png" alt="" aria-hidden="true" />
      <span>BestViews<span>.world</span></span>
    </Link>
  );
}

function PersonAvatar({ name, image }: { name: string; image?: string | null }) {
  return image
    ? <span className="person-avatar" style={{ backgroundImage: `url('${image}')` }} />
    : <span className="person-avatar avatar-fallback">{name.charAt(0).toUpperCase()}</span>;
}

function MomentCard({ view, saved, onSave }: { view: Viewpoint; saved: boolean; onSave: () => void }) {
  return (
    <article className="moment-card" style={{ backgroundImage: `url('${view.image}')` }}>
      <Link className="card-link" href={`/views/${view.slug}`} aria-label={`Open ${view.title}`} />
      {view.contributor && (
        <div className="moment-person">
          <PersonAvatar name={view.contributor.name} image={view.contributor.avatar} />
          <strong>{view.contributor.name}</strong>
        </div>
      )}
      <button className={`moment-save ${saved ? 'saved' : ''}`} type="button" onClick={onSave} aria-label={`${saved ? 'Remove' : 'Save'} ${view.title}`}>
        <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <div className="moment-copy">
        <h2>{view.title}</h2>
        <p><MapPin size={12} /> {view.region}, {view.country}</p>
      </div>
    </article>
  );
}

function ExploreSurface({
  viewpoints,
  category,
  setCategory,
  saved,
  toggleSaved,
  onAdd,
}: {
  viewpoints: Viewpoint[];
  category: string;
  setCategory: (value: string) => void;
  saved: Set<string>;
  toggleSaved: (id: string) => void;
  onAdd: () => void;
}) {
  const cards = category === 'For you' ? viewpoints : viewpoints.filter((view) => view.category === category);
  return (
    <section className="personal-discover content-surface">
      <header className="personal-heading">
        <div>
          <h1>Find the best<br />views anywhere.</h1>
          <p>Shared by people who stood there.</p>
        </div>
      </header>

      <div className="personal-toolbar simple-toolbar">
        <div className="mood-tabs" role="tablist" aria-label="Explore by feeling">
          {categories.map((item) => {
            const Icon = categoryIcons[item];
            return (
              <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item)}>
                <Icon size={14} /> {item === 'For you' ? 'Everything' : item}
              </button>
            );
          })}
        </div>
      </div>

      {cards.length ? (
        <div className="moment-grid">
          {cards.map((view) => <MomentCard key={view.id} view={view} saved={saved.has(view.id)} onSave={() => toggleSaved(view.id)} />)}
        </div>
      ) : (
        <div className="honest-empty">
          <span><Compass size={25} /></span>
          <h2>{category === 'For you' ? 'The first view starts with someone sharing it.' : `No ${category.toLowerCase()} shared yet.`}</h2>
          <p>Know one worth standing still for?</p>
          <button type="button" onClick={onAdd}>Share a view <Plus size={15} /></button>
        </div>
      )}

      {cards.length > 0 && (
        <footer className="share-invitation clean-invitation">
          <p><strong>Know a place that stays with you?</strong><span>Put the exact viewpoint on the map for someone else.</span></p>
          <button type="button" onClick={onAdd}>Share a view <Plus size={15} /></button>
        </footer>
      )}
    </section>
  );
}

function MapSurface({ viewpoints, saved, toggleSaved }: { viewpoints: Viewpoint[]; saved: Set<string>; toggleSaved: (id: string) => void }) {
  const [selected, setSelected] = useState<Viewpoint | null>(viewpoints[0] ?? null);

  const locateNearest = () => {
    if (!viewpoints.length) return;
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const nearest = viewpoints.reduce((closest, view) => {
        const distance = ((view.latitude - coords.latitude) ** 2) + ((view.longitude - coords.longitude) ** 2);
        const closestDistance = ((closest.latitude - coords.latitude) ** 2) + ((closest.longitude - coords.longitude) ** 2);
        return distance < closestDistance ? view : closest;
      });
      setSelected(nearest);
    });
  };

  return (
    <section className="map-surface content-surface" id="map">
      <div className="map-list">
        <div className="map-list-head"><h1>Views around here</h1></div>
        <div className="map-results">
          {viewpoints.map((view) => (
            <button className={`map-result ${selected?.id === view.id ? 'active' : ''}`} type="button" key={view.id} onClick={() => setSelected(view)}>
              <span className="result-image" style={{ backgroundImage: `url('${view.thumb}')` }} />
              <span className="result-copy"><strong>{view.shortTitle}</strong><small>{view.region}, {view.country}</small></span>
              <Heart size={17} fill={saved.has(view.id) ? 'currentColor' : 'none'} onClick={(event) => { event.stopPropagation(); toggleSaved(view.id); }} />
            </button>
          ))}
          {!viewpoints.length && <p className="map-list-empty">No viewpoints have been shared here yet.</p>}
        </div>
      </div>

      <div className="visual-map">
        {selected ? <ExploreMap viewpoints={viewpoints} selected={selected} onSelect={setSelected} ariaLabel="Interactive map of community viewpoints" /> : <div className="map-calm-empty"><MapIcon size={28} /><span>The map is waiting for its first view.</span></div>}
        {selected && (
          <>
            <div className="map-top-actions"><button className="map-near-me" type="button" onClick={locateNearest}><Navigation size={14} /> Near me</button></div>
            <article className="map-popover">
              <span className="popover-image" style={{ backgroundImage: `url('${selected.image}')` }}>
                <button type="button" onClick={() => toggleSaved(selected.id)} aria-label={`Save ${selected.title}`}><Heart size={17} fill={saved.has(selected.id) ? 'currentColor' : 'none'} /></button>
              </span>
              <div><h2>{selected.title}</h2><p>{selected.region}, {selected.country}</p><Link href={`/views/${selected.slug}`}>Open view <ArrowUpRight size={14} /></Link></div>
            </article>
          </>
        )}
      </div>
    </section>
  );
}

function SavedSurface({ viewpoints, saved, toggleSaved }: { viewpoints: Viewpoint[]; saved: Set<string>; toggleSaved: (id: string) => void }) {
  const savedViews = viewpoints.filter((view) => saved.has(view.id));
  return (
    <section className="saved-surface content-surface">
      <div className="saved-head"><div><h1>Views you want to remember.</h1><p>{savedViews.length ? `${savedViews.length} saved ${savedViews.length === 1 ? 'place' : 'places'}` : 'Your personal map starts here.'}</p></div></div>
      {savedViews.length ? (
        <div className="saved-grid">
          {savedViews.map((view) => (
            <article className="saved-card" key={view.id}>
              <Link href={`/views/${view.slug}`} className="saved-photo" style={{ backgroundImage: `url('${view.image}')` }}><span><Eye size={13} /> Open view</span></Link>
              <div><h2>{view.title}</h2><p>{view.region}, {view.country}</p><button type="button" onClick={() => toggleSaved(view.id)}><Check size={14} /> Saved</button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-saved"><span><Bookmark size={28} /></span><h2>Nothing saved yet.</h2><p>Use the heart on a view you want to experience.</p></div>
      )}
    </section>
  );
}

function SearchDialog({ viewpoints, onClose }: { viewpoints: Viewpoint[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => viewpoints.filter((view) => `${view.title} ${view.region} ${view.country}`.toLowerCase().includes(query.toLowerCase())), [query, viewpoints]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search destinations" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-search"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city, region or view" /><button type="button" onClick={onClose}><X size={18} /></button></div>
        <div className="search-body">
          <div className="search-results">
            {results.slice(0, 8).map((view) => (
              <Link href={`/views/${view.slug}`} key={view.id}><span style={{ backgroundImage: `url('${view.thumb}')` }} /><b>{view.title}<small>{view.region}, {view.country}</small></b><ChevronRight size={16} /></Link>
            ))}
          </div>
          {!results.length && <p className="search-empty">No shared views match that place yet.</p>}
        </div>
      </section>
    </div>
  );
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendLink = async () => {
    if (!email.includes('@')) return setError('Enter a valid email address.');
    setBusy(true); setError(null);
    const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (authError) setError(authError.message); else setSent(true);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-label="Sign in" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose}><X size={18} /></button>
        <img src="/bestviews-logo.png" alt="" />
        <h2>{sent ? 'Check your inbox' : 'Keep your views with you.'}</h2>
        <p>{sent ? `We sent a private sign-in link to ${email}.` : 'Sign in to save places, mark where you have been, and share your own viewpoints.'}</p>
        {!sent && <><label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>{error && <p className="submit-error">{error}</p>}<button className="primary-submit" type="button" onClick={() => void sendLink()} disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'} <ChevronRight size={15} /></button></>}
      </section>
    </div>
  );
}

function ProfileDialog({ user, savedCount, visitedCount, submissions, onClose }: { user: User; savedCount: number; visitedCount: number; submissions: SubmissionSummary[]; onClose: () => void }) {
  const signOut = async () => { await getSupabaseBrowserClient().auth.signOut(); onClose(); };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="profile-dialog" role="dialog" aria-modal="true" aria-label="Your profile" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose}><X size={18} /></button>
        <span className="profile-large-avatar">{(user.user_metadata.full_name || user.email || 'T').charAt(0).toUpperCase()}</span>
        <h2>{user.user_metadata.full_name || user.email?.split('@')[0] || 'Traveler'}</h2>
        <p>{user.email}</p>
        <div className="profile-stats"><span><strong>{savedCount}</strong><small>saved</small></span><span><strong>{visitedCount}</strong><small>visited</small></span></div>
        {submissions.length > 0 && <div className="profile-submissions"><h3>Your shared views</h3>{submissions.map((submission, index) => <div key={`${submission.title}-${index}`}><span>{submission.title}</span><small>{submission.status}</small></div>)}</div>}
        <button className="quiet-signout" type="button" onClick={() => void signOut()}>Sign out</button>
      </section>
    </div>
  );
}

function formatCoordinates({ latitude, longitude }: Coordinates) { return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; }
function parseCoordinates(value: string): Coordinates | null {
  const numbers = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length < 2) return null;
  const [latitude, longitude] = numbers;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}
function makeSlug(title: string) {
  const base = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'view';
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

function SubmitDialog({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [lookDirection, setLookDirection] = useState('');
  const [access, setAccess] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [category, setCategory] = useState<ViewCategory>('Hidden gems');
  const [coordinate, setCoordinate] = useState<Coordinates | null>(null);
  const [coordinateText, setCoordinateText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [gpsCandidate, setGpsCandidate] = useState<Coordinates | null>(null);
  const [photoMessage, setPhotoMessage] = useState('JPG, PNG or WebP, up to 8 MB');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCoordinate = (next: Coordinates) => { setCoordinate(next); setCoordinateText(formatCoordinates(next)); setError(null); };
  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return setError('Photo must be under 8 MB.');
    setPhoto(file); setGpsCandidate(null); setError(null); setPhotoMessage('Checking the photo for GPS…');
    try {
      const { gps } = await import('exifr');
      const location = await gps(file) as Coordinates | undefined;
      if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) { setGpsCandidate(location); setPhotoMessage('GPS location found in this photo'); }
      else setPhotoMessage('No GPS found — drop a pin on the map');
    } catch { setPhotoMessage('No readable GPS found — drop a pin on the map'); }
  };

  const submit = async () => {
    const parsed = coordinate ?? parseCoordinates(coordinateText);
    if (!title.trim() || !region.trim() || !country.trim() || !lookDirection.trim() || !parsed || !photo) return setError('Add the name, place, direction, exact pin, and your photo.');
    setSubmitting(true); setError(null);
    const supabase = getSupabaseBrowserClient();
    const extension = photo.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('viewpoint-photos').upload(storagePath, photo, { contentType: photo.type, upsert: false });
    if (uploadError) { setSubmitting(false); return setError(uploadError.message); }
    const { error: insertError } = await supabase.from('viewpoints').insert({
      slug: makeSlug(title), contributor_id: user.id, title: title.trim(), short_title: title.trim(),
      region: region.trim(), country: country.trim(), latitude: parsed.latitude, longitude: parsed.longitude,
      look_direction: lookDirection.trim(), category, best_time: bestTime.trim() || null,
      access_summary: access.trim() || null, cover_photo_path: storagePath, status: 'pending',
    });
    setSubmitting(false);
    if (insertError) { await supabase.storage.from('viewpoint-photos').remove([storagePath]); return setError(insertError.message); }
    onDone(title.trim());
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="submit-dialog" role="dialog" aria-modal="true" aria-label="Share a viewpoint" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose}><X size={18} /></button>
        <h2>Share a view</h2><p>Show someone exactly where to stand and where to look.</p>
        <div className="submission-grid">
          <label>Viewpoint name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The name people will remember" /></label>
          <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as ViewCategory)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Region or city<input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="South Tyrol" /></label>
          <label>Country<input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Italy" /></label>
        </div>
        <label>Direction to look<input value={lookDirection} onChange={(event) => setLookDirection(event.target.value)} placeholder="Face east toward the Odle peaks" /></label>
        <div className="submission-grid">
          <label>Starting point and access<input value={access} onChange={(event) => setAccess(event.target.value)} placeholder="22 min from the upper cable-car station" /></label>
          <label>Best time <span>optional</span><input value={bestTime} onChange={(event) => setBestTime(event.target.value)} placeholder="Around sunrise" /></label>
        </div>
        <label>Exact standing point<div className="location-input"><MapPin size={16} /><input value={coordinateText} onChange={(event) => { setCoordinateText(event.target.value); setCoordinate(parseCoordinates(event.target.value)); }} placeholder="Latitude, longitude" inputMode="decimal" /><button type="button" onClick={() => setPickerOpen((open) => !open)}>{pickerOpen ? 'Hide map' : 'Drop a pin'}</button></div></label>
        {pickerOpen && <LocationPickerMap coordinate={coordinate} onChange={updateCoordinate} ariaLabel="Choose the exact viewpoint on the map" className="location-picker-map" />}
        <label htmlFor="viewpoint-photo">Your photo<div className={`upload-field ${photo ? 'has-photo' : ''}`}><Upload size={20} /><span><strong>{photo?.name || 'Choose a photo you took there'}</strong><small>{photoMessage}</small></span></div></label>
        <input className="visually-hidden" id="viewpoint-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handlePhoto(event.target.files?.[0])} />
        {gpsCandidate && <div className="gps-found"><span><LocateFixed size={16} /><b>Photo location found</b><small>{formatCoordinates(gpsCandidate)}</small></span><button type="button" onClick={() => { updateCoordinate(gpsCandidate); setPickerOpen(true); setGpsCandidate(null); }}>Use location</button></div>}
        {error && <p className="submit-error" role="alert">{error}</p>}
        <button className="primary-submit" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for review'} <ChevronRight size={15} /></button>
      </section>
    </div>
  );
}

export default function ExploreApp({ initialViewpoints }: { initialViewpoints: Viewpoint[] }) {
  const [surface, setSurface] = useState<Surface>('explore');
  const [category, setCategory] = useState<string>('For you');
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const applyUser = (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) { setSaved(new Set()); setVisited(new Set()); setSubmissions([]); }
    };
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.from('saves').select('viewpoint_id').eq('user_id', user.id),
      supabase.from('visits').select('viewpoint_id').eq('user_id', user.id),
      supabase.from('viewpoints').select('title, status').eq('contributor_id', user.id).order('created_at', { ascending: false }).limit(6),
    ]).then(([saveResult, visitResult, submissionResult]) => {
      if (!saveResult.error) setSaved(new Set((saveResult.data || []).map((row) => String(row.viewpoint_id))));
      if (!visitResult.error) setVisited(new Set((visitResult.data || []).map((row) => String(row.viewpoint_id))));
      if (!submissionResult.error) setSubmissions((submissionResult.data || []).map((row) => ({ title: String(row.title), status: String(row.status) })));
    });
  }, [user]);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2600); };
  const requireUser = (next: () => void) => { if (!user) setAuthOpen(true); else next(); };
  const toggleSaved = (viewpointId: string) => requireUser(() => {
    if (!user) return;
    const isSaved = saved.has(viewpointId);
    setSaved((current) => { const next = new Set(current); if (isSaved) next.delete(viewpointId); else next.add(viewpointId); return next; });
    const request = isSaved
      ? getSupabaseBrowserClient().from('saves').delete().eq('user_id', user.id).eq('viewpoint_id', viewpointId)
      : getSupabaseBrowserClient().from('saves').upsert({ user_id: user.id, viewpoint_id: viewpointId });
    void request.then(({ error }) => {
      if (error) { setSaved((current) => { const next = new Set(current); if (isSaved) next.add(viewpointId); else next.delete(viewpointId); return next; }); showToast('Could not update saved views'); }
      else showToast(isSaved ? 'Removed from saved' : 'Saved for later');
    });
  });
  const openSubmit = () => requireUser(() => setSubmitOpen(true));
  const navigate = (next: Surface) => { setSurface(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <main className="explore-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-center"><button className="search" type="button" aria-label="Search destinations" onClick={() => setSearchOpen(true)}><Search size={17} /><span>Search places and views</span></button></div>
        <nav className="header-actions" aria-label="Primary navigation">
          <button className="share-view-top" type="button" onClick={openSubmit}><Plus size={15} /><span>Share a view</span></button>
          <button className="avatar" type="button" aria-label={user ? 'Open profile' : 'Sign in'} onClick={() => user ? setProfileOpen(true) : setAuthOpen(true)}>{user ? (user.user_metadata.full_name || user.email || 'T').charAt(0).toUpperCase() : <UserRound size={16} />}</button>
        </nav>
      </header>

      <aside className="side-rail" aria-label="Explore sections">
        <div>
          <button className={`rail-item ${surface === 'explore' ? 'active' : ''}`} type="button" onClick={() => navigate('explore')}><Compass /><small>Explore</small></button>
          <button className={`rail-item ${surface === 'map' ? 'active' : ''}`} type="button" onClick={() => navigate('map')}><MapIcon /><small>Map</small></button>
          <button className={`rail-item ${surface === 'saved' ? 'active' : ''}`} type="button" onClick={() => requireUser(() => navigate('saved'))}><Bookmark fill={surface === 'saved' ? 'currentColor' : 'none'} /><small>Saved</small></button>
        </div>
        <button className="rail-item add-item" type="button" onClick={openSubmit}><Plus /><small>Add view</small></button>
      </aside>

      {surface === 'explore' && <ExploreSurface viewpoints={initialViewpoints} category={category} setCategory={setCategory} saved={saved} toggleSaved={toggleSaved} onAdd={openSubmit} />}
      {surface === 'map' && <MapSurface viewpoints={initialViewpoints} saved={saved} toggleSaved={toggleSaved} />}
      {surface === 'saved' && <SavedSurface viewpoints={initialViewpoints} saved={saved} toggleSaved={toggleSaved} />}

      {searchOpen && <SearchDialog viewpoints={initialViewpoints} onClose={() => setSearchOpen(false)} />}
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
      {profileOpen && user && <ProfileDialog user={user} savedCount={saved.size} visitedCount={visited.size} submissions={submissions} onClose={() => setProfileOpen(false)} />}
      {submitOpen && user && <SubmitDialog user={user} onClose={() => setSubmitOpen(false)} onDone={(title) => { setSubmissions((current) => [{ title, status: 'pending' }, ...current]); setSubmitOpen(false); showToast('Submitted for community review'); }} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
      <button className="mobile-add" type="button" aria-label="Add viewpoint" onClick={openSubmit}><Camera size={19} /></button>
    </main>
  );
}
