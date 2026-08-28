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
  Map as MapIcon,
  MapPin,
  Mountain,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sunset,
  UserRound,
  Waves,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthDialog from './auth-dialog';
import { getSupabaseBrowserClient } from './supabase';
import type { Coordinates } from './maplibre-map';
import { preparePhotoForUpload, readPhotoCaptureTime, readPhotoLocation } from './photo-location';
import { categories, type ViewCategory, type Viewpoint } from './view-data';

const ExploreMap = dynamic(() => import('./maplibre-map').then((module) => module.ExploreMap), { ssr: false });
const LocationPickerMap = dynamic(() => import('./maplibre-map').then((module) => module.LocationPickerMap), { ssr: false });

type Surface = 'explore' | 'map' | 'saved';
type PhotoLocationState = 'idle' | 'scanning' | 'found' | 'missing' | 'unreadable';

function useAnimatedModalClose(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const closeThen = (afterClose: () => void) => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(afterClose, 190);
  };
  const requestClose = () => closeThen(onClose);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });
  return { closing, requestClose, closeThen };
}

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

function userAvatarUrl(user: User) {
  const value = user.user_metadata.avatar_url || user.user_metadata.picture;
  return typeof value === 'string' && value ? value : null;
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
          <h2>{category === 'For you' ? 'The first view starts with you.' : `No ${category.toLowerCase()} here yet.`}</h2>
          <p>{category === 'For you' ? 'Share a place you still think about.' : 'Know one that belongs here?'}</p>
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
  const { closing, requestClose } = useAnimatedModalClose(onClose);
  const results = useMemo(() => viewpoints.filter((view) => `${view.title} ${view.region} ${view.country}`.toLowerCase().includes(query.toLowerCase())), [query, viewpoints]);
  return (
    <div className={`modal-backdrop ${closing ? 'is-closing' : ''}`} role="presentation" onMouseDown={requestClose}>
      <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search destinations" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-search"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city, region or view" /><button type="button" onClick={requestClose}><X size={18} /></button></div>
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

function formatCoordinates({ latitude, longitude }: Coordinates) { return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; }
function formatCaptureTime(localDateTime: string, timezoneOffset: string | null) {
  const [date, time] = localDateTime.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const label = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(year, month - 1, day, hour, minute));
  return timezoneOffset ? `${label} (UTC${timezoneOffset})` : `${label} (camera time)`;
}
function photoContentType(file: File) {
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'image/jpeg';
  if (file.type === 'image/png' || file.type === 'image/webp') return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return null;
}
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
  const { closing, requestClose, closeThen } = useAnimatedModalClose(onClose);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [access, setAccess] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [category, setCategory] = useState<ViewCategory>('Hidden gems');
  const [coordinate, setCoordinate] = useState<Coordinates | null>(null);
  const [coordinateText, setCoordinateText] = useState('');
  const [coordinateSource, setCoordinateSource] = useState<'photo' | 'manual' | null>(null);
  const [detectedPhotoCoordinate, setDetectedPhotoCoordinate] = useState<Coordinates | null>(null);
  const [capturedAtLocal, setCapturedAtLocal] = useState<string | null>(null);
  const [captureTimezoneOffset, setCaptureTimezoneOffset] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoLocationState, setPhotoLocationState] = useState<PhotoLocationState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoReadId = useRef(0);
  const photoPreview = useMemo(() => photo ? URL.createObjectURL(photo) : null, [photo]);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const updateCoordinate = (next: Coordinates, source: 'photo' | 'manual' = 'manual') => {
    setCoordinate(next);
    setCoordinateText(formatCoordinates(next));
    setCoordinateSource(source);
    setError(null);
  };
  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return setError('Photo must be under 8 MB.');
    if (!photoContentType(file)) return setError('Choose a JPEG, PNG, or WebP photo.');
    const readId = ++photoReadId.current;

    if (coordinateSource === 'photo') {
      setCoordinate(null);
      setCoordinateText('');
      setCoordinateSource(null);
    }
    setPhoto(file);
    setDetectedPhotoCoordinate(null);
    setCapturedAtLocal(null);
    setCaptureTimezoneOffset(null);
    setError(null);
    setPhotoLocationState('scanning');

    const [result, captureTime] = await Promise.all([
      readPhotoLocation(file),
      readPhotoCaptureTime(file),
    ]);
    if (readId !== photoReadId.current) return;
    if (captureTime.kind === 'found') {
      setCapturedAtLocal(captureTime.localDateTime);
      setCaptureTimezoneOffset(captureTime.timezoneOffset);
    }
    if (result.kind === 'found') {
      setDetectedPhotoCoordinate(result.coordinates);
      updateCoordinate(result.coordinates, 'photo');
      setPhotoLocationState('found');
    } else {
      setPhotoLocationState(result.kind);
    }
  };

  const photoLocationMessage = {
    idle: 'If the photo contains GPS data, we can place the pin for you.',
    scanning: 'Checking this photo for an embedded GPS location…',
    found: `Location found${detectedPhotoCoordinate ? `: ${formatCoordinates(detectedPhotoCoordinate)}` : ''}. Please confirm the pin.`,
    missing: 'No GPS location was included. Many gallery apps remove it for privacy — you can place the pin next.',
    unreadable: 'We could not read location data from this file. You can still place the pin next.',
  }[photoLocationState];

  const continueFlow = () => {
    setError(null);
    if (step === 1) {
      if (!photo) return setError('Choose a photo you took there.');
      return setStep(2);
    }
    const parsed = coordinate ?? parseCoordinates(coordinateText);
    if (!region.trim() || !country.trim() || !parsed) return setError('Add the place and mark the exact spot.');
    updateCoordinate(parsed);
    setStep(3);
  };

  const submit = async () => {
    const parsed = coordinate ?? parseCoordinates(coordinateText);
    if (!title.trim() || !region.trim() || !country.trim() || !parsed || !photo) return setError('Give this view a name.');
    setSubmitting(true); setError(null);
    const supabase = getSupabaseBrowserClient();
    let preparedPhoto;
    try {
      preparedPhoto = await preparePhotoForUpload(photo);
    } catch {
      setSubmitting(false);
      return setError('We could not safely prepare this photo. Try a different photo or browser.');
    }
    const storagePath = `${user.id}/${crypto.randomUUID()}.${preparedPhoto.extension}`;
    const { error: uploadError } = await supabase.storage.from('viewpoint-photos').upload(storagePath, preparedPhoto.blob, { contentType: preparedPhoto.contentType, upsert: false });
    if (uploadError) { setSubmitting(false); return setError(uploadError.message); }
    const { error: insertError } = await supabase.from('viewpoints').insert({
      slug: makeSlug(title), contributor_id: user.id, title: title.trim(), short_title: title.trim(),
      region: region.trim(), country: country.trim(), latitude: parsed.latitude, longitude: parsed.longitude,
      look_direction: 'View from the marked spot', category, best_time: bestTime.trim() || null, access_summary: access.trim() || null,
      cover_photo_path: storagePath, captured_at_local: capturedAtLocal, capture_timezone_offset: captureTimezoneOffset, status: 'pending',
    });
    setSubmitting(false);
    if (insertError) { await supabase.storage.from('viewpoint-photos').remove([storagePath]); return setError(insertError.message); }
    closeThen(() => onDone(title.trim()));
  };

  return (
    <div className={`modal-backdrop ${closing ? 'is-closing' : ''}`} role="presentation" onMouseDown={requestClose}>
      <section className="submit-dialog" role="dialog" aria-modal="true" aria-label="Share a viewpoint" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={requestClose}><X size={18} /></button>
        <div className="share-flow-head"><span>Share a view</span><small>{step} of 3</small></div>
        <div className="share-progress" aria-hidden="true">{[1, 2, 3].map((item) => <i className={item <= step ? 'active' : ''} key={item} />)}</div>

        {step === 1 && <div className="share-step share-photo-step">
          <h2>Start with the view.</h2>
          <p>Pick the photo that made you stop.</p>
          <label className={`share-photo-stage ${photoPreview ? 'has-photo' : ''}`} htmlFor="viewpoint-photo" style={photoPreview ? { backgroundImage: `url('${photoPreview}')` } : undefined}>
            <span><Camera size={24} /><strong>{photo ? 'Choose another photo' : 'Choose a photo'}</strong><small>{photo ? 'From your device gallery' : 'JPEG, PNG, or WebP · up to 8 MB'}</small></span>
          </label>
          <input className="visually-hidden" id="viewpoint-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handlePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          <div className={`photo-location-status ${photoLocationState}`} role="status" aria-live="polite">
            {photoLocationState === 'found' ? <Check size={16} /> : <ShieldCheck size={16} />}
            <span><strong>{photoLocationState === 'found' ? 'Photo location detected' : 'GPS is read on this device'}</strong><small>{photoLocationMessage}{capturedAtLocal && <> Taken {formatCaptureTime(capturedAtLocal, captureTimezoneOffset)}.</>}</small></span>
          </div>
        </div>}

        {step === 2 && <div className="share-step share-place-step">
          <h2>Where were you standing?</h2>
          <p>{coordinateSource === 'photo' ? 'We placed the pin from the photo. Check that it is the exact viewpoint.' : 'Tap the map as precisely as you can.'}</p>
          <LocationPickerMap coordinate={coordinate} onChange={(next) => updateCoordinate(next, 'manual')} ariaLabel="Choose the exact viewpoint on the map" className="location-picker-map" />
          <div className="share-place-fields">
            <label>City or region<input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="South Tyrol" autoFocus /></label>
            <label>Country<input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Italy" /></label>
          </div>
          <div className="share-coordinates"><MapPin size={15} /><input aria-label="Viewpoint latitude and longitude" value={coordinateText} onChange={(event) => { const value = event.target.value; const parsed = parseCoordinates(value); setCoordinateText(value); setCoordinate(parsed); setCoordinateSource(parsed ? 'manual' : null); }} placeholder="Or paste latitude, longitude" inputMode="decimal" /></div>
        </div>}

        {step === 3 && <div className="share-step share-details-step">
          <h2>What do you call it?</h2>
          <p>Just enough for someone else to find it.</p>
          <label className="share-name-field">Name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Seceda ridgeline" autoFocus /></label>
          <fieldset className="share-category"><legend>It feels like</legend><div>{categories.slice(1).map((item) => {
            const Icon = categoryIcons[item];
            return <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item as ViewCategory)}><Icon size={15} /> {item}</button>;
          })}</div></fieldset>
          <div className="share-optional-fields">
            <label>Getting there <span>optional</span><input value={access} onChange={(event) => setAccess(event.target.value)} placeholder="Short walk from the cable car" /></label>
            <label>Best moment <span>optional</span><input value={bestTime} onChange={(event) => setBestTime(event.target.value)} placeholder="Early morning" /></label>
          </div>
        </div>}

        <div className="share-flow-footer">
          <span>{error && <small className="submit-error" role="alert">{error}</small>}</span>
          <div>{step > 1 && <button className="share-back" type="button" onClick={() => { setError(null); setStep((step - 1) as 1 | 2); }}>Back</button>}
            {step < 3
              ? <button className="share-next" type="button" onClick={continueFlow} disabled={step === 1 && photoLocationState === 'scanning'}>{photoLocationState === 'scanning' ? 'Checking photo…' : 'Continue'} <ChevronRight size={16} /></button>
              : <button className="share-next" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Sharing…' : 'Share this view'} <ChevronRight size={16} /></button>}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ExploreApp({ initialViewpoints }: { initialViewpoints: Viewpoint[] }) {
  const [surface, setSurface] = useState<Surface>('explore');
  const [category, setCategory] = useState<string>('For you');
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const applyUser = (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) setSaved(new Set());
      if (new URLSearchParams(window.location.search).get('share') === '1') {
        window.history.replaceState({}, '', window.location.pathname);
        if (nextUser) setSubmitOpen(true);
        else setAuthOpen(true);
      }
    };
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    void supabase.from('saves').select('viewpoint_id').eq('user_id', user.id).then((saveResult) => {
      if (!saveResult.error) setSaved(new Set((saveResult.data || []).map((row) => String(row.viewpoint_id))));
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
          {user ? (
            <Link className="avatar" href="/profile" aria-label="Open profile">
              {userAvatarUrl(user)
                ? <img src={userAvatarUrl(user) || ''} alt="" />
                : (user.user_metadata.full_name || user.email || 'T').charAt(0).toUpperCase()}
            </Link>
          ) : <button className="avatar" type="button" aria-label="Sign in" onClick={() => setAuthOpen(true)}><UserRound size={18} strokeWidth={1.8} /></button>}
        </nav>
      </header>

      <aside className="side-rail" aria-label="Explore sections">
        <div>
          <button className={`rail-item ${surface === 'explore' ? 'active' : ''}`} type="button" onClick={() => navigate('explore')}><Compass /><small>Explore</small></button>
          <button className={`rail-item ${surface === 'map' ? 'active' : ''}`} type="button" onClick={() => navigate('map')}><MapIcon /><small>Map</small></button>
          <button className={`rail-item ${surface === 'saved' ? 'active' : ''}`} type="button" onClick={() => requireUser(() => navigate('saved'))}><Bookmark fill={surface === 'saved' ? 'currentColor' : 'none'} /><small>Saved</small></button>
        </div>
        <button className="rail-item add-item" type="button" onClick={openSubmit}><Camera /><small>Share</small></button>
      </aside>

      {surface === 'explore' && <ExploreSurface viewpoints={initialViewpoints} category={category} setCategory={setCategory} saved={saved} toggleSaved={toggleSaved} onAdd={openSubmit} />}
      {surface === 'map' && <MapSurface viewpoints={initialViewpoints} saved={saved} toggleSaved={toggleSaved} />}
      {surface === 'saved' && <SavedSurface viewpoints={initialViewpoints} saved={saved} toggleSaved={toggleSaved} />}

      {searchOpen && <SearchDialog viewpoints={initialViewpoints} onClose={() => setSearchOpen(false)} />}
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
      {submitOpen && user && <SubmitDialog user={user} onClose={() => setSubmitOpen(false)} onDone={() => { setSubmitOpen(false); showToast('Thanks — we’ll check the pin, then share it'); }} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
