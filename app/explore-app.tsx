'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowUpRight,
  Bookmark,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Eye,
  Gem,
  Globe2,
  Heart,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Mountain,
  Navigation,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sunset,
  Trophy,
  Upload,
  Waves,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Coordinates } from './maplibre-map';
import { categories, viewpoints, type Viewpoint } from './view-data';

const ExploreMap = dynamic(
  () => import('./maplibre-map').then((module) => module.ExploreMap),
  { ssr: false },
);
const LocationPickerMap = dynamic(
  () => import('./maplibre-map').then((module) => module.LocationPickerMap),
  { ssr: false },
);

type Surface = 'explore' | 'map' | 'saved';

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

function Rating({ value }: { value: number }) {
  return <span className="rating"><Star size={10} fill="currentColor" /> {value.toFixed(2)}</span>;
}

const contributors = [
  { name: 'Sofia', place: 'Florence', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=85' },
  { name: 'Marco', place: 'Bolzano', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=85' },
  { name: 'Maya', place: 'Lisbon', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=85' },
  { name: 'Jonas', place: 'Oslo', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=85' },
  { name: 'Lena', place: 'New York', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=85' },
  { name: 'Theo', place: 'Alberta', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=85' },
];

function MomentCard({
  view,
  index,
  saved,
  onSave,
}: {
  view: Viewpoint;
  index: number;
  saved: boolean;
  onSave: () => void;
}) {
  const person = contributors[index % contributors.length];
  return (
    <article
      className="moment-card"
      style={{ backgroundImage: `url('${view.image}')` }}
    >
      <Link className="card-link" href={`/views/${view.slug}`} aria-label={`Open ${view.title}`} />
      <div className="moment-person">
        <span style={{ backgroundImage: `url('${person.avatar}')` }} />
        <strong>{person.name}</strong>
      </div>
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
  category,
  setCategory,
  saved,
  toggleSaved,
  onAdd,
}: {
  category: string;
  setCategory: (value: string) => void;
  saved: Set<string>;
  toggleSaved: (slug: string) => void;
  onAdd: () => void;
}) {
  const [feed, setFeed] = useState<'for-you' | 'following'>('for-you');
  const filtered = category === 'For you'
    ? viewpoints
    : viewpoints.filter((view) => view.category === category);
  const ordered = feed === 'following' ? [...viewpoints].reverse() : viewpoints;
  const cards = filtered.length >= 3
    ? filtered.slice(0, 6)
    : [...filtered, ...ordered.filter((view) => !filtered.includes(view))].slice(0, 6);

  return (
    <section className="personal-discover content-surface">
      <header className="personal-heading">
        <div>
          <h1>Find the best<br />views anywhere.</h1>
          <p>Shared by people who stood there.</p>
        </div>
        <div className="people-to-follow">
          {contributors.slice(0, 5).map((person, index) => (
            <button type="button" key={person.name} onClick={() => setFeed('following')} aria-label={`See views from ${person.name}`}>
              <span style={{ backgroundImage: `url('${person.avatar}')` }} /><small>{person.name}</small>{index < 2 && <i />}
            </button>
          ))}
          <button className="find-people" type="button" onClick={() => setFeed('following')}><Plus size={17} /><small>People</small></button>
        </div>
      </header>

      <div className="personal-toolbar">
        <div className="feed-switch" role="tablist" aria-label="Choose your feed">
          <button className={feed === 'for-you' ? 'active' : ''} type="button" onClick={() => setFeed('for-you')}>For you</button>
          <button className={feed === 'following' ? 'active' : ''} type="button" onClick={() => setFeed('following')}>Following</button>
        </div>
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

      <div className="moment-grid">
        {cards.map((view, index) => (
          <MomentCard key={view.slug} view={view} index={index} saved={saved.has(view.slug)} onSave={() => toggleSaved(view.slug)} />
        ))}
      </div>

      <footer className="share-invitation">
        <div className="share-avatars">
          {contributors.slice(0, 3).map((person) => <span key={person.name} style={{ backgroundImage: `url('${person.avatar}')` }} />)}
        </div>
        <p><strong>Know a place that stays with you?</strong><span>Put it on the map for someone else.</span></p>
        <button type="button" onClick={onAdd}>Share a view <Plus size={15} /></button>
      </footer>
    </section>
  );
}

function MapSurface({ saved, toggleSaved }: { saved: Set<string>; toggleSaved: (slug: string) => void }) {
  const [selected, setSelected] = useState(viewpoints[1]);
  const locateNearest = () => {
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
        <div className="map-list-head">
          <h1>Views around here</h1>
        </div>
        <div className="map-results">
          {viewpoints.map((view) => (
            <button className={`map-result ${selected.slug === view.slug ? 'active' : ''}`} type="button" key={view.slug} onClick={() => setSelected(view)}>
              <span className="result-image" style={{ backgroundImage: `url('${view.thumb}')` }} />
              <span className="result-copy">
                <strong>{view.shortTitle}</strong>
                <small>{view.region}, {view.country}</small>
              </span>
              <Heart size={17} fill={saved.has(view.slug) ? 'currentColor' : 'none'} onClick={(event) => { event.stopPropagation(); toggleSaved(view.slug); }} />
            </button>
          ))}
        </div>
      </div>

      <div className="visual-map">
        <ExploreMap viewpoints={viewpoints} selected={selected} onSelect={setSelected} ariaLabel="Interactive map of remarkable viewpoints" />
        <div className="map-top-actions">
          <button className="map-near-me" type="button" onClick={locateNearest}><Navigation size={14} /> Near me</button>
        </div>
        <article className="map-popover">
          <span className="popover-image" style={{ backgroundImage: `url('${selected.image}')` }}>
            <button type="button" onClick={() => toggleSaved(selected.slug)} aria-label={`Save ${selected.title}`}><Heart size={17} fill={saved.has(selected.slug) ? 'currentColor' : 'none'} /></button>
          </span>
          <div>
            <h2>{selected.title}</h2>
            <p>{selected.region}, {selected.country}</p>
            <Link href={`/views/${selected.slug}`}>Open view <ArrowUpRight size={14} /></Link>
          </div>
        </article>
      </div>
    </section>
  );
}

function RankingsSurface() {
  return (
    <section className="ranking-surface content-surface">
      <div className="ranking-hero">
        <div>
          <h1>The world&apos;s most<br />extraordinary views.</h1>
          <p>Ranked by people who have actually stood there, with pairwise comparisons that make every vote count.</p>
        </div>
        <div className="ranking-stat"><strong>2.4M</strong><span>comparisons made</span><small>↑ 12,842 this week</small></div>
      </div>
      <div className="ranking-controls">
        <div><button className="active" type="button">World</button><button type="button">Europe</button><button type="button">Americas</button><button type="button">Asia</button></div>
        <button type="button"><SlidersHorizontal size={14} /> All types</button>
      </div>
      <div className="ranking-list">
        {viewpoints.map((view, index) => (
          <Link href={`/views/${view.slug}`} className={`ranking-row ${index === 0 ? 'winner' : ''}`} key={view.slug}>
            <span className="big-rank">{String(view.rank).padStart(2, '0')}</span>
            <span className="rank-photo" style={{ backgroundImage: `url('${view.thumb}')` }} />
            <span className="rank-place"><strong>{view.title}</strong><small><MapPin size={11} /> {view.region}, {view.country}</small></span>
            <span className="rank-category">{view.category}</span>
            <span className="trip-score"><strong>{view.detour}%</strong><small>worth a special trip</small></span>
            <span className="rank-rating"><Star size={12} fill="currentColor" /> {view.rating.toFixed(2)}</span>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
      <div className="compare-card">
        <div><Sparkles size={19} /><span><strong>Which view stays with you?</strong><small>Compare two places you&apos;ve visited to sharpen the rankings.</small></span></div>
        <button type="button">Start comparing <ChevronRight size={15} /></button>
      </div>
    </section>
  );
}

function SavedSurface({ saved, toggleSaved }: { saved: Set<string>; toggleSaved: (slug: string) => void }) {
  const savedViews = viewpoints.filter((view) => saved.has(view.slug));
  return (
    <section className="saved-surface content-surface">
      <div className="saved-head">
        <div><h1>Places I want to remember.</h1><p>Your future journeys, collected in one calm corner.</p></div>
        <div className="passport"><Globe2 size={25} /><span><strong>7</strong><small>countries explored</small></span><span><strong>23</strong><small>views experienced</small></span></div>
      </div>
      {savedViews.length ? (
        <div className="saved-grid">
          {savedViews.map((view) => (
            <article className="saved-card" key={view.slug}>
              <Link href={`/views/${view.slug}`} className="saved-photo" style={{ backgroundImage: `url('${view.image}')` }}><span><Eye size={13} /> View spot</span></Link>
              <div><span><Rating value={view.rating} /><small>{view.category}</small></span><h2>{view.title}</h2><p>{view.region}, {view.country}</p><button type="button" onClick={() => toggleSaved(view.slug)}><Check size={14} /> Saved</button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-saved"><span><Bookmark size={28} /></span><h2>Your next unforgettable view starts here.</h2><p>Tap the heart on any viewpoint to add it to your bucket list.</p></div>
      )}
    </section>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => viewpoints.filter((view) => `${view.title} ${view.region} ${view.country}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search destinations" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-search"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘sunset near Florence’" /><kbd>ESC</kbd><button type="button" onClick={onClose}><X size={18} /></button></div>
        <div className="search-body">
          <span className="eyebrow">{query ? `${results.length} matching views` : 'Popular right now'}</span>
          <div className="search-results">
            {results.slice(0, 5).map((view) => (
              <Link href={`/views/${view.slug}`} key={view.slug}><span style={{ backgroundImage: `url('${view.thumb}')` }} /><b>{view.title}<small>{view.region}, {view.country}</small></b><em>{view.rating.toFixed(2)} <Star size={10} fill="currentColor" /></em><ChevronRight size={16} /></Link>
            ))}
          </div>
          {!query && <div className="quick-search"><button type="button"><Sunset size={14} /> Best sunsets</button><button type="button"><Mountain size={14} /> The Dolomites</button><button type="button"><Building2 size={14} /> City skylines</button><button type="button"><Gem size={14} /> Hidden gems</button></div>}
        </div>
      </section>
    </div>
  );
}

function formatCoordinates({ latitude, longitude }: Coordinates) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function parseCoordinates(value: string): Coordinates | null {
  const numbers = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length < 2) return null;
  let [latitude, longitude] = numbers;
  if (/\bS\b/i.test(value)) latitude = -Math.abs(latitude);
  if (/\bW\b/i.test(value)) longitude = -Math.abs(longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

function SubmitDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [coordinate, setCoordinate] = useState<Coordinates | null>(null);
  const [coordinateText, setCoordinateText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [gpsCandidate, setGpsCandidate] = useState<Coordinates | null>(null);
  const [photoMessage, setPhotoMessage] = useState('GPS is read privately in your browser when available');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCoordinate = (next: Coordinates) => {
    setCoordinate(next);
    setCoordinateText(formatCoordinates(next));
    setError(null);
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Photo must be under 4 MB.');
      return;
    }
    setPhoto(file);
    setGpsCandidate(null);
    setError(null);
    setPhotoMessage('Checking the photo for GPS…');
    try {
      const { gps } = await import('exifr');
      const location = await gps(file) as Coordinates | undefined;
      if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
        setGpsCandidate(location);
        setPhotoMessage('GPS location found in this photo');
      } else {
        setPhotoMessage('No GPS metadata found — you can drop a pin instead');
      }
    } catch {
      setPhotoMessage('No readable GPS metadata — you can drop a pin instead');
    }
  };

  const submit = async () => {
    const parsed = coordinate ?? parseCoordinates(coordinateText);
    if (!title.trim()) {
      setError('Add a name for this viewpoint.');
      return;
    }
    if (!parsed) {
      setError('Choose a point on the map or enter valid latitude and longitude.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let photoKey: string | null = null;
      if (photo) {
        const upload = new FormData();
        upload.set('photo', photo);
        const uploadResponse = await fetch('/api/uploads', { method: 'POST', body: upload });
        const uploadResult = await uploadResponse.json() as { key?: string; error?: string };
        if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Could not upload the photo');
        photoKey = uploadResult.key ?? null;
      }

      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'submit', title: title.trim(), coordinates: formatCoordinates(parsed), photoKey }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save the viewpoint');
      onDone();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not save the viewpoint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="submit-dialog" role="dialog" aria-modal="true" aria-label="Add a viewpoint" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose}><X size={18} /></button>
        <span className="dialog-icon"><MapPin size={20} /></span>
        <h2>Know an extraordinary view?</h2>
        <p>Tell us exactly where to stand. Every submission is checked by the community before it goes live.</p>
        <label>Viewpoint name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Sant'Elia hill overlook" /></label>
        <label>Exact location<div className="location-input"><MapPin size={16} /><input value={coordinateText} onChange={(event) => { const value = event.target.value; setCoordinateText(value); setCoordinate(parseCoordinates(value)); }} onBlur={() => { const parsed = parseCoordinates(coordinateText); if (parsed) updateCoordinate(parsed); }} placeholder="Latitude, longitude" inputMode="decimal" /><button type="button" onClick={() => setPickerOpen((open) => !open)}>{pickerOpen ? 'Hide map' : 'Drop a pin'}</button></div></label>
        {pickerOpen && <LocationPickerMap coordinate={coordinate} onChange={updateCoordinate} ariaLabel="Choose the exact viewpoint on the map" className="location-picker-map" />}
        <label htmlFor="viewpoint-photo">Your photo<div className={`upload-field ${photo ? 'has-photo' : ''}`}><Upload size={20} /><span><strong>{photo?.name || 'Choose a recent photo'}</strong><small>{photo ? photoMessage : 'JPG, PNG or WebP, up to 4 MB'}</small></span></div></label>
        <input className="visually-hidden" id="viewpoint-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handlePhoto(event.target.files?.[0])} />
        {gpsCandidate && (
          <div className="gps-found"><span><LocateFixed size={16} /><b>Photo location available</b><small>{formatCoordinates(gpsCandidate)}</small></span><button type="button" onClick={() => { updateCoordinate(gpsCandidate); setPickerOpen(true); setGpsCandidate(null); setPhotoMessage('Photo GPS applied — confirm the pin before submitting'); }}>Use location</button></div>
        )}
        <p className="metadata-note">We only read the GPS tags needed to suggest a pin. Other photo metadata is ignored.</p>
        {error && <p className="submit-error" role="alert">{error}</p>}
        <button className="primary-submit" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Saving viewpoint…' : 'Submit for review'} <ChevronRight size={15} /></button>
      </section>
    </div>
  );
}

export default function ExploreApp({ userName }: { userName: string | null }) {
  const [surface, setSurface] = useState<Surface>('explore');
  const [category, setCategory] = useState<string>('For you');
  const [saved, setSaved] = useState<Set<string>>(new Set(['seceda-ridgeline', 'vernazza-overlook']));
  const [searchOpen, setSearchOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const toggleSaved = (slug: string) => {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(slug)) {
        next.delete(slug);
        showToast('Removed from your bucket list');
      } else {
        next.add(slug);
        showToast(userName ? 'Saved to your bucket list' : 'Saved for this visit · sign in to sync');
      }
      return next;
    });
  };

  const navigate = (next: Surface) => {
    setSurface(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="explore-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-center">
          <button className="search" type="button" aria-label="Search destinations" onClick={() => setSearchOpen(true)}>
            <Search size={17} /><span>Search places and views</span><kbd>⌘ K</kbd>
          </button>
        </div>
        <nav className="header-actions" aria-label="Primary navigation">
          <button className="share-view-top" type="button" onClick={() => setSubmitOpen(true)}><Plus size={15} /><span>Share a view</span></button>
          <button className="avatar" type="button" aria-label="Open profile">{userName?.charAt(0).toUpperCase() || 'M'}</button>
        </nav>
      </header>

      <aside className="side-rail" aria-label="Explore sections">
        <div>
          <button className={`rail-item ${surface === 'explore' ? 'active' : ''}`} type="button" onClick={() => navigate('explore')}><Compass /><small>Explore</small></button>
          <button className={`rail-item ${surface === 'map' ? 'active' : ''}`} type="button" onClick={() => navigate('map')}><MapIcon /><small>Map</small></button>
          <button className={`rail-item ${surface === 'saved' ? 'active' : ''}`} type="button" onClick={() => navigate('saved')}><Bookmark fill={surface === 'saved' ? 'currentColor' : 'none'} /><small>Saved</small></button>
        </div>
        <button className="rail-item add-item" type="button" onClick={() => setSubmitOpen(true)}><Plus /><small>Add view</small></button>
      </aside>

      {surface === 'explore' && <ExploreSurface category={category} setCategory={setCategory} saved={saved} toggleSaved={toggleSaved} onAdd={() => setSubmitOpen(true)} />}
      {surface === 'map' && <MapSurface saved={saved} toggleSaved={toggleSaved} />}
      {surface === 'saved' && <SavedSurface saved={saved} toggleSaved={toggleSaved} />}

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
      {submitOpen && <SubmitDialog onClose={() => setSubmitOpen(false)} onDone={() => { setSubmitOpen(false); showToast('Draft saved — now add the practical details'); }} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
      <button className="mobile-add" type="button" aria-label="Add viewpoint" onClick={() => setSubmitOpen(true)}><Camera size={19} /></button>
    </main>
  );
}
