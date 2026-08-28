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
type PlaceLookupState = 'idle' | 'loading' | 'found' | 'failed';
type LocationSearchState = 'idle' | 'loading' | 'ready' | 'empty' | 'failed';
type CoordinateSource = 'photo' | 'device' | 'search' | 'manual';
type ShareMode = 'past' | 'now';
type LiveLocationState = 'idle' | 'locating' | 'found' | 'failed';
type LocationSuggestion = {
  id: string;
  name: string;
  context: string;
  label: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
};

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

function formatCoordinates({ latitude, longitude }: Coordinates) { return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`; }
function localDateTimeValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function timezoneOffsetFor(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  return `${sign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`;
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
  const [mobileModeChoice] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches);
  const [shareMode, setShareMode] = useState<ShareMode | null>(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches ? null : 'past');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [access, setAccess] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [category, setCategory] = useState<ViewCategory>('Hidden gems');
  const [coordinate, setCoordinate] = useState<Coordinates | null>(null);
  const [coordinateText, setCoordinateText] = useState('');
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource | null>(null);
  const [capturedAtLocal, setCapturedAtLocal] = useState<string | null>(null);
  const [captureTimezoneOffset, setCaptureTimezoneOffset] = useState<string | null>(null);
  const [captureTimeSource, setCaptureTimeSource] = useState<'exif' | 'file' | null>(null);
  const [placeLookupState, setPlaceLookupState] = useState<PlaceLookupState>('idle');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationSearchState, setLocationSearchState] = useState<LocationSearchState>('idle');
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoLocationState, setPhotoLocationState] = useState<PhotoLocationState>('idle');
  const [liveLocationState, setLiveLocationState] = useState<LiveLocationState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoReadId = useRef(0);
  const placeLookupId = useRef(0);
  const liveLocationId = useRef(0);
  const locationSearchId = useRef(0);
  const photoPreview = useMemo(() => photo ? URL.createObjectURL(photo) : null, [photo]);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (!locationSearchOpen || query.length < 3) return;

    const searchId = ++locationSearchId.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/location-search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          const data = await response.json() as { suggestions?: LocationSuggestion[] };
          if (searchId !== locationSearchId.current) return;
          if (!response.ok) throw new Error('Search unavailable');
          const suggestions = data.suggestions || [];
          setLocationSuggestions(suggestions);
          setLocationSearchState(suggestions.length ? 'ready' : 'empty');
        })
        .catch(() => {
          if (controller.signal.aborted || searchId !== locationSearchId.current) return;
          setLocationSuggestions([]);
          setLocationSearchState('failed');
        });
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery, locationSearchOpen]);

  const updateCoordinate = (next: Coordinates, source: CoordinateSource = 'manual') => {
    setCoordinate(next);
    setCoordinateText(formatCoordinates(next));
    setCoordinateSource(source);
    setError(null);
  };

  const lookupPlace = async (next: Coordinates, requestId: number) => {
    setPlaceLookupState('loading');
    try {
      const params = new URLSearchParams({ lat: String(next.latitude), lon: String(next.longitude) });
      const response = await fetch(`/api/reverse-geocode?${params}`);
      const place = await response.json() as { region?: string; country?: string };
      if (requestId !== placeLookupId.current) return;
      if (response.ok && place.region && place.country) {
        setRegion((current) => current.trim() || place.region || '');
        setCountry((current) => current.trim() || place.country || '');
        setLocationQuery((current) => current.trim() || `${place.region}, ${place.country}`);
        setLocationSearchState('idle');
        setLocationSearchOpen(false);
        setPlaceLookupState('found');
      } else setPlaceLookupState('failed');
    } catch {
      if (requestId === placeLookupId.current) setPlaceLookupState('failed');
    }
  };

  const resetCaptureChoice = () => {
    photoReadId.current += 1;
    placeLookupId.current += 1;
    setPhoto(null);
    setPhotoLocationState('idle');
    setCoordinate(null);
    setCoordinateText('');
    setCoordinateSource(null);
    setRegion('');
    setCountry('');
    setLocationQuery('');
    setLocationSuggestions([]);
    setLocationSearchState('idle');
    setLocationSearchOpen(false);
    setPlaceLookupState('idle');
    setCapturedAtLocal(null);
    setCaptureTimezoneOffset(null);
    setCaptureTimeSource(null);
  };

  const choosePastShare = () => {
    liveLocationId.current += 1;
    resetCaptureChoice();
    setShareMode('past');
    setLiveLocationState('idle');
    setError(null);
  };

  const chooseLiveShare = () => {
    const now = new Date();
    const liveRequestId = ++liveLocationId.current;
    resetCaptureChoice();
    setShareMode('now');
    setCapturedAtLocal(localDateTimeValue(now));
    setCaptureTimezoneOffset(timezoneOffsetFor(now));
    setCaptureTimeSource(null);
    setLiveLocationState('locating');
    setError(null);

    if (!navigator.geolocation) {
      setLiveLocationState('failed');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (liveRequestId !== liveLocationId.current) return;
        const next = { latitude: coords.latitude, longitude: coords.longitude };
        updateCoordinate(next, 'device');
        setLiveLocationState('found');
        const placeRequestId = ++placeLookupId.current;
        void lookupPlace(next, placeRequestId);
      },
      () => {
        if (liveRequestId === liveLocationId.current) setLiveLocationState('failed');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 },
    );
  };

  const chooseLocationSuggestion = (suggestion: LocationSuggestion) => {
    setLocationQuery(suggestion.label);
    setRegion(suggestion.region);
    setCountry(suggestion.country);
    setLocationSuggestions([]);
    setLocationSearchState('idle');
    setLocationSearchOpen(false);
    setPlaceLookupState('found');
    updateCoordinate({ latitude: suggestion.latitude, longitude: suggestion.longitude }, 'search');
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
    if (shareMode !== 'now') {
      setCapturedAtLocal(null);
      setCaptureTimezoneOffset(null);
      setCaptureTimeSource(null);
    }
    setPlaceLookupState('idle');
    setError(null);
    setPhotoLocationState('scanning');

    if (shareMode === 'now') {
      setPhotoLocationState('idle');
      return;
    }

    const [result, captureTime] = await Promise.all([
      readPhotoLocation(file),
      readPhotoCaptureTime(file),
    ]);
    if (readId !== photoReadId.current) return;
    if (captureTime.kind === 'found') {
      setCapturedAtLocal(captureTime.localDateTime);
      setCaptureTimezoneOffset(captureTime.timezoneOffset);
      setCaptureTimeSource(captureTime.source);
    }
    if (result.kind === 'found') {
      updateCoordinate(result.coordinates, 'photo');
      setPhotoLocationState('found');
      const placeRequestId = ++placeLookupId.current;
      void lookupPlace(result.coordinates, placeRequestId);
    } else {
      setPhotoLocationState(result.kind);
    }
  };

  const continueFlow = () => {
    setError(null);
    if (step === 1) {
      if (!photo) return setError('Choose a photo you took there.');
      if (shareMode === 'now' && !capturedAtLocal) return setError('Add when you were there.');
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
      cover_photo_path: storagePath, captured_at_local: capturedAtLocal, capture_timezone_offset: captureTimezoneOffset, capture_time_source: captureTimeSource, status: 'pending',
    });
    setSubmitting(false);
    if (insertError) { await supabase.storage.from('viewpoint-photos').remove([storagePath]); return setError(insertError.message); }
    closeThen(() => onDone(title.trim()));
  };

  const findingPlace = placeLookupState === 'loading' || locationSearchState === 'loading';

  const goBack = () => {
    setError(null);
    if (step === 1 && mobileModeChoice) {
      liveLocationId.current += 1;
      setShareMode(null);
      setLiveLocationState('idle');
      return;
    }
    setStep((step - 1) as 1 | 2);
  };

  return (
    <div className={`modal-backdrop ${closing ? 'is-closing' : ''}`} role="presentation" onMouseDown={requestClose}>
      <section className="submit-dialog" role="dialog" aria-modal="true" aria-label="Share a viewpoint" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={requestClose}><X size={18} /></button>
        <div className="share-flow-head"><span>Share a view</span>{shareMode && <small>{step} of 3</small>}</div>
        {shareMode && <div className="share-progress" aria-hidden="true">{[1, 2, 3].map((item) => <i className={item <= step ? 'active' : ''} key={item} />)}</div>}

        {shareMode === null && <div className="share-step share-mode-step">
          <h2>When was this view?</h2>
          <p>Choose how you want to share it.</p>
          <div className="share-mode-options">
            <button type="button" onClick={choosePastShare}>
              <span><Camera size={19} /></span>
              <strong>From a past visit<small>Choose a photo and mark where it was taken.</small></strong>
              <ChevronRight size={17} />
            </button>
            <button type="button" onClick={chooseLiveShare}>
              <span><Navigation size={19} /></span>
              <strong>I’m here now<small>Use your live location and current time.</small></strong>
              <ChevronRight size={17} />
            </button>
          </div>
        </div>}

        {shareMode && step === 1 && <div className={`share-step share-photo-step ${shareMode === 'now' ? 'share-now-photo-step' : ''}`}>
          <h2>Start with the view.</h2>
          <p>{shareMode === 'now' ? 'Take or choose the photo you are looking at.' : 'Pick the photo that made you stop.'}</p>
          <label className={`share-photo-stage ${photoPreview ? 'has-photo' : ''}`} htmlFor="viewpoint-photo" style={photoPreview ? { backgroundImage: `url('${photoPreview}')` } : undefined}>
            <span><Camera size={24} /><strong>{photo ? 'Choose another photo' : 'Choose a photo'}</strong><small>{photo ? 'From your device gallery' : 'JPEG, PNG, or WebP · up to 8 MB'}</small></span>
          </label>
          <input className="visually-hidden" id="viewpoint-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handlePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          {shareMode === 'now' && <div className="share-live-meta">
            <label htmlFor="viewpoint-live-time">Time
              <input
                id="viewpoint-live-time"
                type="datetime-local"
                value={capturedAtLocal || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setCapturedAtLocal(value || null);
                  const selectedDate = new Date(value);
                  setCaptureTimezoneOffset(value && !Number.isNaN(selectedDate.getTime()) ? timezoneOffsetFor(selectedDate) : null);
                  setCaptureTimeSource(null);
                  setError(null);
                }}
              />
            </label>
            <small className={`share-live-location ${liveLocationState}`}>
              {liveLocationState === 'locating' && 'Getting your live location…'}
              {liveLocationState === 'found' && 'Live location ready'}
              {liveLocationState === 'failed' && 'Location unavailable — place the pin manually next.'}
            </small>
          </div>}
        </div>}

        {shareMode && step === 2 && <div className="share-step share-place-step">
          <h2>Where were you standing?</h2>
          <p>{coordinateSource === 'photo' ? 'We placed the pin from the photo. Check that it is the exact viewpoint.' : coordinateSource === 'device' ? 'We used your current location. Check that the pin is exactly right.' : coordinateSource === 'search' ? 'We moved the pin to that place. Fine-tune the exact viewpoint on the map.' : 'Search for the place, then tap the map as precisely as you can.'}</p>
          <div
            className="share-place-search"
            onFocus={(event) => {
              if ((event.target as HTMLElement).id !== 'viewpoint-location-search') return;
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              if (locationQuery.trim().length >= 3) {
                setLocationSearchOpen(true);
                setLocationSearchState('loading');
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setLocationSearchOpen(false);
                setLocationSearchState('idle');
              }
            }}
          >
            <label htmlFor="viewpoint-location-search">Location</label>
            <div className="location-controls-row">
              <div className="location-search-column">
                <div className={`share-coordinates place-search-input ${locationSearchState === 'loading' ? 'loading' : ''}`}>
                  <Search size={16} />
                  <input
                    id="viewpoint-location-search"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={locationSearchOpen && locationQuery.trim().length >= 3}
                    aria-controls="viewpoint-location-suggestions"
                    autoComplete="off"
                    value={locationQuery}
                    onChange={(event) => {
                      const value = event.target.value;
                      setLocationQuery(value);
                      setLocationSuggestions([]);
                      setLocationSearchState(value.trim().length >= 3 ? 'loading' : 'idle');
                      setRegion('');
                      setCountry('');
                      setPlaceLookupState('idle');
                      setLocationSearchOpen(true);
                      setError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setLocationSearchOpen(false);
                        setLocationSearchState('idle');
                      }
                    }}
                    placeholder="Search a city, region, or landmark"
                    autoFocus={coordinateSource !== 'photo'}
                  />
                </div>
                {locationSearchOpen && locationQuery.trim().length >= 3 && <div className="place-search-suggestions" id="viewpoint-location-suggestions" role="listbox">
                  {locationSearchState === 'loading' && <small className="place-search-message">Searching places…</small>}
                  {locationSearchState === 'empty' && <small className="place-search-message">No places found. Try a nearby city or region.</small>}
                  {locationSearchState === 'failed' && <small className="place-search-message">Search is unavailable right now. Try again.</small>}
                  {locationSearchState === 'ready' && locationSuggestions.map((suggestion) => <button type="button" role="option" aria-selected="false" key={suggestion.id} onClick={() => chooseLocationSuggestion(suggestion)}>
                    <MapPin size={15} />
                    <span><strong>{suggestion.name}</strong>{suggestion.context && <small>{suggestion.context}</small>}</span>
                  </button>)}
                </div>}
              </div>
              <div className="share-coordinates location-coordinate-box">
                <MapPin size={13} />
                <input id="viewpoint-coordinates" aria-label="Viewpoint latitude and longitude" value={coordinateText} onFocus={() => { setLocationSearchOpen(false); setLocationSearchState('idle'); }} onChange={(event) => { const value = event.target.value; const parsed = parseCoordinates(value); setCoordinateText(value); setCoordinate(parsed); setCoordinateSource(parsed ? 'manual' : null); }} placeholder="Lat, lon" inputMode="decimal" />
              </div>
            </div>
          </div>
          <LocationPickerMap coordinate={coordinate} onChange={(next) => updateCoordinate(next, 'manual')} ariaLabel="Choose the exact viewpoint on the map" className="location-picker-map" />
          <small className="place-search-attribution">Search data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · <a href="https://github.com/komoot/photon" target="_blank" rel="noreferrer">Photon</a></small>
        </div>}

        {shareMode && step === 3 && <div className="share-step share-details-step">
          <h2>What do you call it?</h2>
          <p>Just enough for someone else to find it.</p>
          <label className="share-name-field">Name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Seceda ridgeline" autoFocus /></label>
          <fieldset className="share-category"><legend>It feels like</legend><div>{categories.slice(1).map((item) => {
            const Icon = categoryIcons[item];
            return <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item as ViewCategory)}><Icon size={15} /> {item}</button>;
          })}</div></fieldset>
          <details className="share-optional-disclosure">
            <summary>Add helpful details <span>optional</span></summary>
            <div className="share-optional-fields">
              <label>Getting there<input value={access} onChange={(event) => setAccess(event.target.value)} placeholder="Short walk from the cable car" /></label>
              <label>Best moment<input value={bestTime} onChange={(event) => setBestTime(event.target.value)} placeholder="Early morning" /></label>
            </div>
          </details>
        </div>}

        {shareMode && <div className="share-flow-footer">
          <span>{error && <small className="submit-error" role="alert">{error}</small>}</span>
          <div>{(step > 1 || mobileModeChoice) && <button className="share-back" type="button" onClick={goBack}>Back</button>}
            {step < 3
              ? <button className="share-next" type="button" onClick={continueFlow} disabled={(step === 1 && photoLocationState === 'scanning') || (step === 2 && findingPlace && (!region || !country))}>{step === 1 && photoLocationState === 'scanning' ? 'Checking photo…' : step === 2 && findingPlace && (!region || !country) ? 'Finding place…' : step === 1 && photoLocationState === 'found' ? 'Review location' : 'Continue'} <ChevronRight size={16} /></button>
              : <button className="share-next" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Sharing…' : 'Share this view'} <ChevronRight size={16} /></button>}
          </div>
        </div>}
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
