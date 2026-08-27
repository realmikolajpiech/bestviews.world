'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  Bookmark,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Compass,
  Eye,
  Footprints,
  Gem,
  Globe2,
  Heart,
  LocateFixed,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Mountain,
  Navigation,
  Plus,
  Search,
  Send,
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
import { categories, viewpoints, type Viewpoint } from './view-data';

type Surface = 'explore' | 'map' | 'rankings' | 'saved';

const mapTiles = Array.from({ length: 16 }, (_, index) => {
  const x = 15 + (index % 4);
  const y = 9 + Math.floor(index / 4);
  return `https://a.basemaps.cartocdn.com/light_all/5/${x}/${y}@2x.png`;
});

const markerPositions = [
  { left: '58%', top: '44%' },
  { left: '54%', top: '59%' },
  { left: '25%', top: '33%' },
  { left: '18%', top: '71%' },
  { left: '47%', top: '27%' },
  { left: '67%', top: '19%' },
];

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
      <span className="brand-mark" aria-hidden="true"><i /><b /></span>
      <span>BestViews<span>.world</span></span>
    </Link>
  );
}

function Rating({ value }: { value: number }) {
  return <span className="rating"><Star size={10} fill="currentColor" /> {value.toFixed(2)}</span>;
}

function ViewCard({
  view,
  featured = false,
  saved,
  onSave,
}: {
  view: Viewpoint;
  featured?: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <article
      className={`view-card ${featured ? 'featured' : ''}`}
      style={{ backgroundImage: `url('${view.image}')` }}
    >
      {featured && <div className="editor-label"><Sparkles size={12} /> Editor&apos;s pick</div>}
      <button className={`heart ${saved ? 'saved' : ''}`} type="button" onClick={onSave} aria-label={`${saved ? 'Remove' : 'Save'} ${view.title}`}>
        <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <Link className="card-link" href={`/views/${view.slug}`} aria-label={`Open ${view.title}`} />
      <div className="card-copy">
        <Rating value={view.rating} />
        <h2>{view.title}</h2>
        <p>{view.region}, {view.country}</p>
        <div className="visit-time"><Clock3 size={13} />{view.bestTime} · {view.bestSeason.split('–')[0]}</div>
      </div>
      {featured && (
        <Link className="open-view" href={`/views/${view.slug}`}>
          See exact viewpoint <ArrowUpRight size={14} />
        </Link>
      )}
    </article>
  );
}

function ExploreSurface({
  category,
  setCategory,
  saved,
  toggleSaved,
}: {
  category: string;
  setCategory: (value: string) => void;
  saved: Set<string>;
  toggleSaved: (slug: string) => void;
}) {
  const filtered = category === 'For you'
    ? viewpoints
    : viewpoints.filter((view) => view.category === category);
  const cards = filtered.length >= 3 ? filtered.slice(0, 3) : [...filtered, ...viewpoints.filter((view) => !filtered.includes(view))].slice(0, 3);

  return (
    <section className="discover content-surface">
      <div className="section-heading">
        <div>
          <h1>Find a view worth the journey.</h1>
        </div>
        <div className="story-tabs" role="tablist" aria-label="Explore filters">
          {categories.map((item) => {
            const Icon = categoryIcons[item];
            return (
              <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item)}>
                <Icon size={13} /> {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="view-grid">
        {cards.map((view, index) => (
          <ViewCard key={view.slug} view={view} featured={index === 0} saved={saved.has(view.slug)} onSave={() => toggleSaved(view.slug)} />
        ))}
      </div>

      <div className="bottom-line">
        <p><strong>2,847</strong> remarkable views, mapped by people who stood there.</p>
        <div className="people" aria-label="Community contributors">
          <span style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80')" }} />
          <span style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80')" }} />
          <span style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80')" }} />
          <small>+12k explorers</small>
        </div>
      </div>

      <section className="rank-preview">
        <div className="rank-title">
          <div><h2>Worth a special trip</h2></div>
          <button type="button">How ranking works <ArrowUpRight size={14} /></button>
        </div>
        <div className="rank-strip">
          {viewpoints.slice(0, 4).map((view) => (
            <Link href={`/views/${view.slug}`} className="mini-rank" key={view.slug}>
              <span className="rank-number">#{view.rank}</span>
              <span className="mini-thumb" style={{ backgroundImage: `url('${view.thumb}')` }} />
              <span className="mini-copy"><strong>{view.shortTitle}</strong><small>{view.country}</small></span>
              <span className="detour"><strong>{view.detour}%</strong><small>would detour</small></span>
              <ChevronRight size={16} />
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}

function MapSurface({ saved, toggleSaved }: { saved: Set<string>; toggleSaved: (slug: string) => void }) {
  const [selected, setSelected] = useState(viewpoints[1]);
  return (
    <section className="map-surface content-surface" id="map">
      <div className="map-list">
        <div className="map-list-head">
          <h1>Italy & the Alps</h1>
          <p>128 exact viewpoints in this area</p>
        </div>
        <div className="map-filter-row">
          <button type="button"><SlidersHorizontal size={14} /> Filters</button>
          <button type="button">Open now</button>
          <button type="button">Free</button>
        </div>
        <div className="map-results">
          {viewpoints.slice(0, 5).map((view) => (
            <button className={`map-result ${selected.slug === view.slug ? 'active' : ''}`} type="button" key={view.slug} onClick={() => setSelected(view)}>
              <span className="result-image" style={{ backgroundImage: `url('${view.thumb}')` }} />
              <span className="result-copy">
                <span><strong>{view.shortTitle}</strong><Rating value={view.rating} /></span>
                <small>{view.region}, {view.country}</small>
                <em><Clock3 size={11} /> {view.bestTime} · {view.walk}</em>
              </span>
              <Heart size={17} fill={saved.has(view.slug) ? 'currentColor' : 'none'} onClick={(event) => { event.stopPropagation(); toggleSaved(view.slug); }} />
            </button>
          ))}
        </div>
      </div>

      <div className="visual-map">
        <div className="tile-grid" aria-hidden="true">
          {mapTiles.map((tile) => <span key={tile} style={{ backgroundImage: `url('${tile}')` }} />)}
        </div>
        <div className="map-tools">
          <button type="button" aria-label="Locate me"><LocateFixed size={18} /></button>
          <button type="button" aria-label="Zoom in">+</button>
          <button type="button" aria-label="Zoom out">−</button>
        </div>
        <div className="map-mode-pill"><MapIcon size={14} /> Photo map <span>On</span></div>
        {viewpoints.map((view, index) => (
          <button
            key={view.slug}
            type="button"
            className={`photo-marker ${selected.slug === view.slug ? 'active' : ''}`}
            style={{ ...markerPositions[index], backgroundImage: `url('${view.thumb}')` }}
            onClick={() => setSelected(view)}
            aria-label={`Show ${view.title}`}
          ><span>{view.rating.toFixed(1)}</span></button>
        ))}
        <article className="map-popover">
          <span className="popover-image" style={{ backgroundImage: `url('${selected.image}')` }}>
            <button type="button" onClick={() => toggleSaved(selected.slug)} aria-label={`Save ${selected.title}`}><Heart size={17} fill={saved.has(selected.slug) ? 'currentColor' : 'none'} /></button>
          </span>
          <div>
            <span><Rating value={selected.rating} /> #{selected.rank} in the world</span>
            <h2>{selected.title}</h2>
            <p>{selected.region}, {selected.country}</p>
            <small><Footprints size={12} /> {selected.walk}<b>·</b><Clock3 size={12} /> Best {selected.bestTime}</small>
            <Link href={`/views/${selected.slug}`}>View exact spot <ArrowUpRight size={14} /></Link>
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

function SubmitDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="submit-dialog" role="dialog" aria-modal="true" aria-label="Add a viewpoint" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose}><X size={18} /></button>
        <span className="dialog-icon"><MapPin size={20} /></span>
        <h2>Know an extraordinary view?</h2>
        <p>Tell us exactly where to stand. Every submission is checked by the community before it goes live.</p>
        <label>Viewpoint name<input placeholder="e.g. Sant'Elia hill overlook" /></label>
        <label>Exact location<div className="location-input"><MapPin size={16} /><input placeholder="Drop a pin or paste coordinates" /><button type="button">Open map</button></div></label>
        <label>Your photo<div className="upload-field"><Upload size={20} /><span><strong>Drop a recent photo here</strong><small>JPG or PNG, up to 10 MB</small></span></div></label>
        <button className="primary-submit" type="button" onClick={onDone}>Continue to visit details <ChevronRight size={15} /></button>
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
        <div className="view-switcher" role="tablist" aria-label="Choose discovery view">
          <button className={surface === 'explore' ? 'active' : ''} type="button" onClick={() => navigate('explore')}><LayoutGrid size={14} /> Discover</button>
          <button className={surface === 'map' ? 'active' : ''} type="button" onClick={() => navigate('map')}><MapIcon size={14} /> Map</button>
        </div>
        <button className="search" type="button" aria-label="Search destinations" onClick={() => setSearchOpen(true)}>
          <Search size={17} /><span>Search any city, region or view</span><kbd>⌘ K</kbd>
        </button>
        <nav className="header-actions" aria-label="Primary navigation">
          <button className="near-me" type="button" onClick={() => { navigate('map'); showToast('Showing remarkable views near you'); }}><Navigation size={15} /> Near me</button>
          <button className="avatar" type="button" aria-label="Open profile">{userName?.charAt(0).toUpperCase() || 'M'}</button>
        </nav>
      </header>

      <aside className="side-rail" aria-label="Explore sections">
        <div>
          <button className={`rail-item ${surface === 'explore' ? 'active' : ''}`} type="button" onClick={() => navigate('explore')}><Compass /><small>Explore</small></button>
          <button className={`rail-item ${surface === 'map' ? 'active' : ''}`} type="button" onClick={() => navigate('map')}><MapIcon /><small>Map</small></button>
          <button className={`rail-item ${surface === 'saved' ? 'active' : ''}`} type="button" onClick={() => navigate('saved')}><Bookmark fill={surface === 'saved' ? 'currentColor' : 'none'} /><small>Saved</small></button>
          <button className={`rail-item ${surface === 'rankings' ? 'active' : ''}`} type="button" onClick={() => navigate('rankings')}><Trophy /><small>Rankings</small></button>
        </div>
        <button className="rail-item add-item" type="button" onClick={() => setSubmitOpen(true)}><Plus /><small>Add view</small></button>
      </aside>

      {surface === 'explore' && <ExploreSurface category={category} setCategory={setCategory} saved={saved} toggleSaved={toggleSaved} />}
      {surface === 'map' && <MapSurface saved={saved} toggleSaved={toggleSaved} />}
      {surface === 'rankings' && <RankingsSurface />}
      {surface === 'saved' && <SavedSurface saved={saved} toggleSaved={toggleSaved} />}

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
      {submitOpen && <SubmitDialog onClose={() => setSubmitOpen(false)} onDone={() => { setSubmitOpen(false); showToast('Draft saved — now add the practical details'); }} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
      <button className="mobile-add" type="button" aria-label="Add viewpoint" onClick={() => setSubmitOpen(true)}><Camera size={19} /></button>
    </main>
  );
}
