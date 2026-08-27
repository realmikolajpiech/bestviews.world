'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Bookmark,
  Bus,
  Check,
  Clock3,
  Compass,
  Footprints,
  Heart,
  Info,
  MapPin,
  Navigation,
  Share2,
  Star,
  Sun,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { Viewpoint } from '../../view-data';

function DetailBrand() {
  return (
    <Link className="brand detail-brand" href="/">
      <span className="brand-mark" aria-hidden="true"><i /><b /></span>
      <span>BestViews<span>.world</span></span>
    </Link>
  );
}

export default function ViewDetail({ view }: { view: Viewpoint }) {
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.coordinates)}`;

  return (
    <main className="simple-detail-page">
      <header className="simple-detail-topbar">
        <Link href="/" className="back-button"><ArrowLeft size={17} /> Discover</Link>
        <DetailBrand />
        <button className="simple-share" type="button" onClick={() => notify('Share link copied')}><Share2 size={16} /> Share</button>
      </header>

      <section className="simple-hero" style={{ backgroundImage: `url('${view.image}')` }}>
        <div className="simple-hero-shade" />
        <div className="simple-hero-copy">
          <h1>{view.title}</h1>
          <p><MapPin size={14} /> {view.region}, {view.country}</p>
          <div><strong><Star size={13} fill="currentColor" /> {view.rating.toFixed(2)}</strong><span>{view.reviews.toLocaleString()} ratings</span><i /><span>#{view.rank} in the world</span></div>
        </div>
        <div className="simple-light"><Sun size={18} /><span><small>Best today</small><strong>{view.bestTime}</strong></span></div>
      </section>

      <nav className="simple-actions" aria-label="Viewpoint actions">
        <div>
          <button className={saved ? 'active' : ''} type="button" onClick={() => { setSaved(!saved); notify(saved ? 'Removed from your saved views' : 'Saved to your bucket list'); }}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}</button>
          <button className={visited ? 'active visited' : ''} type="button" onClick={() => { setVisited(!visited); notify(visited ? 'Removed from your map' : 'Added to your world map'); }}><Check size={17} /> {visited ? 'Experienced' : 'Been here'}</button>
          <a href={directions} target="_blank" rel="noreferrer"><Navigation size={17} /> Get directions</a>
        </div>
      </nav>

      <div className="simple-detail-content">
        <section className="simple-intro">
          <p>{view.description}</p>
          <div className="simple-score"><span>{view.detour}%</span><p><strong>Worth a special trip</strong><small>Rated by people who have been here</small></p></div>
        </section>

        <section className="simple-essentials">
          <div><Clock3 /><span><small>Best time</small><strong>{view.bestTime}</strong></span></div>
          <div><Footprints /><span><small>Walk</small><strong>{view.walk}</strong></span></div>
          <div><Compass /><span><small>Difficulty</small><strong>{view.difficulty}</strong></span></div>
          <div><Info /><span><small>Cost</small><strong>{view.cost}</strong></span></div>
        </section>

        <section className="simple-spot-section">
          <div className="simple-section-title"><h2>Where to stand</h2><button type="button" onClick={() => notify('Coordinates copied')}><MapPin size={14} /> {view.coordinates}</button></div>
          <div className="simple-spot-card">
            <div className="simple-map">
              <span className="simple-pin"><MapPin size={20} fill="currentColor" /></span>
              <span className="simple-look"><i /><b>LOOK THIS WAY</b></span>
              <small>OpenStreetMap</small>
            </div>
            <div className="simple-spot-copy">
              <span><Check size={12} /> Community confirmed</span>
              <h3>Exact viewpoint</h3>
              <p>{view.tip}</p>
              <div><Compass size={16} /><span><small>Direction to look</small><strong>{view.lookDirection}</strong></span></div>
              <a href={directions} target="_blank" rel="noreferrer">Open in maps <Navigation size={15} /></a>
            </div>
          </div>
        </section>

        <section className="simple-visit-grid">
          <article className="simple-visit-card">
            <Sun size={22} />
            <div><h2>Go tomorrow morning</h2><p>Light cloud, 14 km visibility, and fewer people before 07:30.</p><span>Excellent conditions · 86%</span></div>
          </article>
          <article className="simple-tip-card">
            <span className="simple-tip-avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=85')" }} />
            <div><h2>One useful tip</h2><p>“Walk past the obvious bench—the next rise has the cleaner angle and is much quieter.”</p><small>Sofia R. · Local contributor</small></div>
            <button type="button"><Heart size={14} /> 84</button>
          </article>
        </section>

        <section className="simple-access">
          <span><Bus size={16} /><strong>Public transport available</strong></span>
          <span><Users size={16} /><strong>Quietest before 07:30</strong></span>
          <span><Check size={16} /><strong>Coordinates verified</strong></span>
        </section>
      </div>

      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
