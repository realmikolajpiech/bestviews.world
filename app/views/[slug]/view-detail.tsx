'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Clock3,
  Compass,
  Footprints,
  Heart,
  MapPin,
  Maximize2,
  Navigation,
  Share2,
  Star,
  Sun,
} from 'lucide-react';
import { useState } from 'react';
import type { Viewpoint } from '../../view-data';

const ViewpointMap = dynamic(
  () => import('../../maplibre-map').then((module) => module.ViewpointMap),
  { ssr: false },
);

function Mark() {
  return <img className="brand-mark" src="/bestviews-logo.png" alt="" aria-hidden="true" />;
}

export default function ViewDetail({ view }: { view: Viewpoint }) {
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.coordinates)}`;

  return (
    <main className="view-screen">
      <header className="view-screen-header">
        <Link href="/" className="view-back"><ArrowLeft size={17} /> Discover</Link>
        <Link href="/" className="view-logo"><Mark /><span>BestViews<span>.world</span></span></Link>
        <button type="button" className="view-share" onClick={() => notify('Link copied')}><Share2 size={16} /><span>Share</span></button>
      </header>

      <div className="view-stage">
        <section className="view-photo" style={{ backgroundImage: `url('${view.image}')` }} aria-label={`View from ${view.title}`}>
          <div className="view-photo-shade" />
          <div className="view-photo-status">
            <span><Star size={12} fill="currentColor" /> {view.rating.toFixed(2)}</span>
            <small>#{view.rank} in the world</small>
          </div>
          <button className="view-expand" type="button" aria-label="Expand photo"><Maximize2 size={17} /></button>
          <div className="view-photo-credit">Community photo · this week</div>
        </section>

        <aside className="view-panel">
          <div className="view-identity">
            <p><MapPin size={13} /> {view.region}, {view.country}</p>
            <h1>{view.title}</h1>
            <div><span><Star size={12} fill="currentColor" /> {view.rating.toFixed(2)}</span><small>{view.reviews.toLocaleString()} ratings</small><i /><small>{view.detour}% would make a special trip</small></div>
          </div>

          <div className="view-primary-actions">
            <button className={saved ? 'active' : ''} type="button" onClick={() => { setSaved(!saved); notify(saved ? 'Removed from saved' : 'Saved for your trip'); }}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /><span>{saved ? 'Saved' : 'Save'}</span></button>
            <button className={visited ? 'active visited' : ''} type="button" onClick={() => { setVisited(!visited); notify(visited ? 'Removed from your map' : 'Added to your map'); }}><Check size={17} /><span>{visited ? 'Been here' : 'Been here?'}</span></button>
            <a href={directions} target="_blank" rel="noreferrer"><Navigation size={17} /><span>Directions</span></a>
          </div>

          <section className="your-moment">
            <Sun size={20} />
            <div><small>Your best moment</small><strong>Tomorrow · {view.bestTime}</strong></div>
            <span>86%</span>
          </section>

          <section className="stand-panel">
            <div className="stand-panel-head"><h2>Stand here</h2><span><Check size={11} /> Verified</span></div>
            <div className="stand-mini-map">
              <ViewpointMap
                coordinate={{ latitude: view.latitude, longitude: view.longitude }}
                ariaLabel={`Interactive map showing the exact viewpoint for ${view.title}`}
              />
              <span className="panel-look"><i /><b>LOOK</b></span>
              <small>{view.coordinates}</small>
            </div>
            <div className="stand-instruction"><Compass size={16} /><span><small>Face this way</small><strong>{view.lookDirection}</strong></span></div>
          </section>

          <section className="view-facts">
            <div><Clock3 /><span><small>Best light</small><strong>{view.bestTime}</strong></span></div>
            <div><Footprints /><span><small>Getting there</small><strong>{view.walk}</strong></span></div>
            <div><Compass /><span><small>Effort</small><strong>{view.difficulty}</strong></span></div>
          </section>

          <section className="one-tip">
            <span className="tip-person" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=85')" }} />
            <div><small>Sofia&apos;s tip</small><p>{view.tip}</p></div>
            <button type="button" aria-label="Mark tip helpful"><Heart size={14} /></button>
          </section>
        </aside>
      </div>

      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
