'use client';

import Link from 'next/link';
import {
  Accessibility,
  ArrowLeft,
  Bookmark,
  Bus,
  CalendarDays,
  Camera,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CloudSun,
  Compass,
  Footprints,
  Heart,
  Info,
  MapPin,
  Navigation,
  Share2,
  Sparkles,
  Star,
  Sun,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { Viewpoint } from '../../view-data';
import { viewpoints } from '../../view-data';

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
  const [photo, setPhoto] = useState(view.image);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.coordinates)}`;
  const gallery = [view, ...viewpoints.filter((item) => item.slug !== view.slug).slice(0, 3)];

  return (
    <main className="detail-page">
      <header className="detail-topbar">
        <Link href="/" className="back-button"><ArrowLeft size={17} /> Explore</Link>
        <DetailBrand />
        <div><button type="button" onClick={() => notify('Share link copied')}><Share2 size={16} /> Share</button><button className="detail-avatar" type="button">M</button></div>
      </header>

      <section className="detail-hero" style={{ backgroundImage: `url('${photo}')` }}>
        <div className="detail-gradient" />
        <div className="hero-rank"><Sparkles size={13} /> #{view.rank} view in the world</div>
        <div className="detail-title">
          <span>{view.region} · {view.country}</span>
          <h1>{view.title}</h1>
          <div><strong><Star size={14} fill="currentColor" /> {view.rating.toFixed(2)}</strong><span>{view.reviews.toLocaleString()} community ratings</span><i /><span>{view.detour}% say it&apos;s worth a special trip</span></div>
        </div>
        <div className="best-light"><Sun size={18} /><span><small>Best light today</small><strong>{view.bestTime}</strong></span></div>
        <div className="gallery-rail">
          {gallery.map((item, index) => <button type="button" key={item.slug} onClick={() => setPhoto(item.image)} className={photo === item.image ? 'active' : ''} style={{ backgroundImage: `url('${item.thumb}')` }}>{index === 3 && <span><Camera size={13} /> +24</span>}</button>)}
        </div>
        <button className="gallery-arrow left" type="button"><ChevronLeft size={17} /></button>
        <button className="gallery-arrow right" type="button"><ChevronRight size={17} /></button>
      </section>

      <nav className="detail-actions" aria-label="Viewpoint actions">
        <div className="detail-tabs"><a href="#overview" className="active">Overview</a><a href="#stand">Exact spot</a><a href="#photos">Photos <span>28</span></a><a href="#tips">Tips <span>46</span></a></div>
        <div>
          <button className={saved ? 'active' : ''} type="button" onClick={() => { setSaved(!saved); notify(saved ? 'Removed from your bucket list' : 'Saved to your bucket list'); }}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}</button>
          <button className={visited ? 'active visited' : ''} type="button" onClick={() => { setVisited(!visited); notify(visited ? 'Removed from experienced views' : 'Added to your world map'); }}><Check size={16} /> {visited ? 'Experienced' : 'Been here'}</button>
          <a className="directions-button" href={directions} target="_blank" rel="noreferrer"><Navigation size={16} /> Get directions</a>
        </div>
      </nav>

      <div className="detail-layout" id="overview">
        <div className="detail-main">
          <section className="intro-section">
            <span className="eyebrow">Why it&apos;s exceptional</span>
            <p>{view.description}</p>
            <div className="visit-verdict"><span><Sparkles size={16} /></span><div><strong>Worth planning around</strong><p>Go out of your way for this one. The community ranks it in the top 2% of all mapped views.</p></div><b>{view.detour}%</b></div>
          </section>

          <section className="stand-section" id="stand">
            <div className="section-label"><div><span className="eyebrow">The exact viewpoint</span><h2>Stand here. Look this way.</h2></div><button type="button" onClick={() => notify('Coordinates copied')}><MapPin size={14} /> Copy coordinates</button></div>
            <div className="stand-card">
              <div className="stand-map">
                <div className="map-lines" />
                <span className="exact-pin"><MapPin size={19} fill="currentColor" /></span>
                <span className="look-cone"><i /><b>LOOK EAST</b></span>
                <div className="map-credit">OpenStreetMap</div>
              </div>
              <div className="stand-copy">
                <span className="spot-confirmed"><Check size={11} /> Community confirmed</span>
                <h3>Ridge path viewpoint</h3>
                <p>{view.tip}</p>
                <div><span><MapPin size={15} /><b>{view.coordinates}<small>Tap to copy</small></b></span><span><Compass size={15} /><b>{view.lookDirection}<small>Best framing direction</small></b></span></div>
                <a href={directions} target="_blank" rel="noreferrer">Open in maps <Navigation size={14} /></a>
              </div>
            </div>
          </section>

          <section className="practical-section">
            <div className="section-label"><div><span className="eyebrow">Know before you go</span><h2>Plan the moment.</h2></div><small>Updated 4 days ago</small></div>
            <div className="practical-grid">
              <div><span><Clock3 /></span><small>Best time</small><strong>{view.bestTime}</strong><p>Arrive 25 min before</p></div>
              <div><span><CalendarDays /></span><small>Best season</small><strong>{view.bestSeason}</strong><p>Clearer on weekdays</p></div>
              <div><span><Footprints /></span><small>Effort</small><strong>{view.difficulty}</strong><p>{view.walk}</p></div>
              <div><span><Info /></span><small>Cost</small><strong>{view.cost}</strong><p>No reservation needed</p></div>
              <div><span><Users /></span><small>Crowds</small><strong>Quiet before 07:30</strong><p>Busy from mid-morning</p></div>
              <div><span><CloudSun /></span><small>Visibility</small><strong>78% chance</strong><p>Best window tomorrow</p></div>
            </div>
          </section>

          <section className="community-section" id="tips">
            <div className="section-label"><div><span className="eyebrow">From people who stood here</span><h2>Small details that make the visit.</h2></div><button type="button">Leave a tip</button></div>
            <article className="featured-tip">
              <span className="tip-avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=85')" }} />
              <div><span><strong>Sofia R.</strong><small>Local contributor · 34 views</small></span><p>“The cable car opening looks late on paper, but in midsummer the first cabin still gets you there before direct light reaches the ridge. Walk past the obvious bench—the next rise is much quieter.”</p><small>Visited 12 days ago · Helpful to 84 people</small></div>
              <button type="button"><Heart size={14} /> 84</button>
            </article>
          </section>

          <section className="community-photos" id="photos">
            <div className="section-label"><div><span className="eyebrow">Recent conditions</span><h2>Seen through the community.</h2></div><button type="button">View all 28</button></div>
            <div>{gallery.map((item, index) => <button type="button" onClick={() => setPhoto(item.image)} key={item.slug} style={{ backgroundImage: `url('${item.image}')` }}><span>{index === 0 ? 'This week' : `${index + 2} weeks ago`}</span></button>)}</div>
          </section>
        </div>

        <aside className="visit-sidebar">
          <section className="conditions-card">
            <div><span className="eyebrow">Your best window</span><strong>Tomorrow<br />06:15–07:20</strong></div>
            <Sun size={39} />
            <p><span><CloudSun size={14} /> Light cloud</span><span>11°C</span><span>14 km visibility</span></p>
            <div className="condition-score"><i style={{ width: '86%' }} /><span>Excellent conditions · 86%</span></div>
            <button type="button" onClick={() => notify('Visit reminder set for tomorrow')}>Remind me <CalendarDays size={14} /></button>
          </section>
          <section className="access-card">
            <span className="eyebrow">Getting there</span>
            <div><Car size={16} /><span><strong>Parking</strong><small>Upper station · 220 spaces</small></span><Check size={14} /></div>
            <div><Bus size={16} /><span><strong>Public transport</strong><small>Bus 350 every 30 min</small></span><Check size={14} /></div>
            <div><Accessibility size={16} /><span><strong>Accessibility</strong><small>Uneven final 400 m</small></span><Info size={14} /></div>
          </section>
          <section className="curator-card"><span className="curator-photo" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=85')" }} /><div><small>Mapped by</small><strong>Marco Bellini</strong><span>Top contributor · Italy</span></div><button type="button">Follow</button></section>
        </aside>
      </div>

      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
