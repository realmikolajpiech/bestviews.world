'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { User } from '@supabase/supabase-js';
import { Bookmark, CalendarDays, Check, Clock3, Compass, Footprints, MapPin, Navigation, Reply, Search, Share2, Sun, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AuthDialog from '../../auth-dialog';
import AppNavigation from '../../app-navigation';
import SiteBrand from '../../site-brand';
import { getSupabaseBrowserClient } from '../../supabase';
import type { Viewpoint } from '../../view-data';

const ViewpointMap = dynamic(() => import('../../maplibre-map').then((module) => module.ViewpointMap), { ssr: false });
const tipSelect = 'id, parent_id, body, status, created_at, profiles!tips_author_id_fkey(id, username, display_name, avatar_url)';
const legacyTipSelect = 'id, body, status, created_at, profiles!tips_author_id_fkey(id, username, display_name, avatar_url)';

type Tip = {
  id: string;
  parentId: string | null;
  body: string;
  status: string;
  createdAt: string;
  authorId: string | null;
  author: string;
  authorUsername: string | null;
  authorAvatar: string | null;
};
type TipThread = Tip & { replies: TipThread[] };

function capturedAtLabel(localDateTime: string) {
  const [date, time] = localDateTime.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const dateLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(value);
  const timeLabel = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(value);
  return `${dateLabel} · ${timeLabel}`;
}

function mapTips(data: Record<string, unknown>[] | null): Tip[] {
  return (data || []).map((row) => {
    const profileValue = row.profiles;
    const profile = Array.isArray(profileValue) ? profileValue[0] : profileValue;
    const person = profile && typeof profile === 'object' ? profile as Record<string, unknown> : null;
    return {
      id: String(row.id),
      parentId: row.parent_id ? String(row.parent_id) : null,
      body: String(row.body),
      status: String(row.status),
      createdAt: String(row.created_at),
      authorId: person?.id ? String(person.id) : null,
      author: person?.display_name ? String(person.display_name) : 'Traveler',
      authorUsername: person?.username ? String(person.username) : null,
      authorAvatar: person?.avatar_url ? String(person.avatar_url) : null,
    };
  });
}

async function fetchTipDiscussion(viewpointId: string) {
  const supabase = getSupabaseBrowserClient();
  const threadedResult = await supabase.from('tips').select(tipSelect).eq('viewpoint_id', viewpointId).order('created_at', { ascending: true });
  if (!threadedResult.error) return { tips: mapTips(threadedResult.data), threadingAvailable: true };
  const legacyResult = await supabase.from('tips').select(legacyTipSelect).eq('viewpoint_id', viewpointId).order('created_at', { ascending: true });
  return { tips: mapTips(legacyResult.data), threadingAvailable: false };
}

function buildTipThreads(tips: Tip[]) {
  const byId = new Map<string, TipThread>();
  tips.forEach((tip) => byId.set(tip.id, { ...tip, replies: [] }));
  const roots: TipThread[] = [];
  byId.forEach((tip) => {
    const parent = tip.parentId ? byId.get(tip.parentId) : null;
    if (parent) parent.replies.push(tip);
    else roots.push(tip);
  });
  return roots;
}

function discussionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function DiscussionItem({ tip, depth, canReply, replyingTo, replyBody, onReply, onReplyBody, onSubmitReply, onCancelReply }: {
  tip: TipThread;
  depth: number;
  canReply: boolean;
  replyingTo: string | null;
  replyBody: string;
  onReply: (tip: Tip) => void;
  onReplyBody: (value: string) => void;
  onSubmitReply: (tip: Tip) => void;
  onCancelReply: () => void;
}) {
  const authorHref = tip.authorUsername ? `/profile/${tip.authorUsername}` : tip.authorId ? `/profile/${tip.authorId}` : null;
  return (
    <div className={`discussion-branch discussion-depth-${Math.min(depth, 3)}`}>
      <article className="discussion-item">
        {authorHref ? (
          <Link className={`discussion-avatar ${tip.authorAvatar ? 'has-image' : ''}`} href={authorHref} style={tip.authorAvatar ? { backgroundImage: `url('${tip.authorAvatar}')` } : undefined} aria-label={`View ${tip.author}'s profile`}>
            {!tip.authorAvatar && tip.author.charAt(0).toUpperCase()}
          </Link>
        ) : <span className="discussion-avatar">{tip.author.charAt(0).toUpperCase()}</span>}
        <div className="discussion-copy">
          <div className="discussion-byline">
            {authorHref ? <Link href={authorHref}>{tip.author}</Link> : <strong>{tip.author}</strong>}
            <span aria-hidden="true">·</span>
            <time dateTime={tip.createdAt}>{discussionDate(tip.createdAt)}</time>
          </div>
          <p>{tip.body}</p>
          {canReply && <button className="discussion-reply" type="button" onClick={() => onReply(tip)}><Reply size={13} /> Reply</button>}
        </div>
      </article>
      {replyingTo === tip.id && (
        <div className="discussion-reply-composer">
          <textarea value={replyBody} onChange={(event) => onReplyBody(event.target.value)} maxLength={280} rows={2} autoFocus placeholder={`Reply to ${tip.author}`} />
          <div><button type="button" onClick={onCancelReply} aria-label="Cancel reply"><X size={14} /></button><button type="button" onClick={() => onSubmitReply(tip)} disabled={replyBody.trim().length < 4}>Reply</button></div>
        </div>
      )}
      {tip.replies.length > 0 && <div className="discussion-replies">{tip.replies.map((reply) => <DiscussionItem key={reply.id} tip={reply} depth={depth + 1} canReply={canReply} replyingTo={replyingTo} replyBody={replyBody} onReply={onReply} onReplyBody={onReplyBody} onSubmitReply={onSubmitReply} onCancelReply={onCancelReply} />)}</div>}
    </div>
  );
}

export default function ViewDetail({ view }: { view: Viewpoint }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [threadingAvailable, setThreadingAvailable] = useState(true);
  const [tipBody, setTipBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const tipThreads = useMemo(() => buildTipThreads(tips), [tips]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2200); };
  const loadTips = async () => {
    const result = await fetchTipDiscussion(view.id);
    setThreadingAvailable(result.threadingAvailable);
    setTips(result.tips);
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const applyUser = (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) {
        setSaved(false);
        setVisited(false);
        setProfileAvatar(null);
      } else {
        void supabase.from('profiles').select('avatar_url').eq('id', nextUser.id).maybeSingle().then(({ data }) => {
          setProfileAvatar(typeof data?.avatar_url === 'string' ? data.avatar_url : null);
        });
      }
    };
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null));
    void fetchTipDiscussion(view.id).then((result) => {
      setThreadingAvailable(result.threadingAvailable);
      setTips(result.tips);
    });
    return () => data.subscription.unsubscribe();
  }, [view.id]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    void Promise.all([
      supabase.from('saves').select('viewpoint_id').eq('user_id', user.id).eq('viewpoint_id', view.id).maybeSingle(),
      supabase.from('visits').select('viewpoint_id').eq('user_id', user.id).eq('viewpoint_id', view.id).maybeSingle(),
    ]).then(([saveResult, visitResult]) => { setSaved(Boolean(saveResult.data)); setVisited(Boolean(visitResult.data)); });
  }, [user, view.id]);

  const requireUser = (action: () => void) => user ? action() : setAuthOpen(true);
  const toggleSaved = () => requireUser(() => {
    if (!user) return;
    const next = !saved; setSaved(next);
    const request = next
      ? getSupabaseBrowserClient().from('saves').upsert({ user_id: user.id, viewpoint_id: view.id })
      : getSupabaseBrowserClient().from('saves').delete().eq('user_id', user.id).eq('viewpoint_id', view.id);
    void request.then(({ error }) => { if (error) setSaved(!next); else notify(next ? 'Saved for later' : 'Removed from saved'); });
  });
  const toggleVisited = () => requireUser(() => {
    if (!user) return;
    const next = !visited; setVisited(next);
    const request = next
      ? getSupabaseBrowserClient().from('visits').upsert({ user_id: user.id, viewpoint_id: view.id })
      : getSupabaseBrowserClient().from('visits').delete().eq('user_id', user.id).eq('viewpoint_id', view.id);
    void request.then(({ error }) => { if (error) setVisited(!next); else notify(next ? 'Added to your map' : 'Removed from your map'); });
  });
  const postDiscussion = (body: string, parentId: string | null, onDone: () => void) => requireUser(() => {
    if (!user || body.trim().length < 4) return;
    if (parentId && !threadingAvailable) return notify('Replies are not available yet');
    const record = { viewpoint_id: view.id, author_id: user.id, body: body.trim(), status: 'approved', ...(threadingAvailable ? { parent_id: parentId } : {}) };
    void getSupabaseBrowserClient().from('tips').insert(record).then(({ error }) => {
      if (error) notify('Could not post that message');
      else { onDone(); notify(parentId ? 'Reply posted' : 'Tip posted'); void loadTips(); }
    });
  });
  const addTip = () => postDiscussion(tipBody, null, () => setTipBody(''));
  const startReply = (tip: Tip) => requireUser(() => { setReplyingTo(tip.id); setReplyBody(''); });
  const addReply = (tip: Tip) => postDiscussion(replyBody, tip.id, () => { setReplyingTo(null); setReplyBody(''); });
  const share = async () => {
    if (navigator.share) await navigator.share({ title: view.title, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); notify('Link copied'); }
  };

  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.coordinates)}`;
  const viewerAvatar = profileAvatar || (user && (user.user_metadata.avatar_url || user.user_metadata.picture));
  return (
    <main className="view-screen">
      <header className="view-screen-header site-topbar app-page-topbar">
        <SiteBrand />
        <AppNavigation />
        <div className="topbar-tools">
          <Link className="compact-search topbar-search" href="/?search=1"><Search size={16} /><span>Search views</span></Link>
          <nav className="view-header-actions" aria-label="View navigation">
            <button type="button" className="view-share" onClick={() => void share()}><Share2 size={16} /><span>Share</span></button>
            {user ? (
              <Link className="avatar view-header-avatar" href="/profile" aria-label="Open your profile">
                {typeof viewerAvatar === 'string' && viewerAvatar ? <img src={viewerAvatar} alt="" /> : (user.user_metadata.full_name || user.email || 'T').charAt(0).toUpperCase()}
              </Link>
            ) : (
              <button className="avatar view-header-avatar" type="button" aria-label="Sign in" onClick={() => setAuthOpen(true)}><UserRound size={18} /></button>
            )}
          </nav>
        </div>
      </header>

      <div className="view-stage">
        <section className="view-photo" style={{ backgroundImage: `url('${view.image}')` }} aria-label={`View from ${view.title}`}><div className="view-photo-shade" /></section>
        <aside className="view-panel">
          <div className="view-identity">
            <p><MapPin size={13} /> {view.region}, {view.country}</p>
            <h1>{view.title}</h1>
            {view.contributor && (
              <Link className="view-contributor" href={`/profile/${view.contributor.username || view.contributor.id}`} aria-label={`View ${view.contributor.name}'s profile`}>
                <span className={view.contributor.avatar ? 'has-image' : ''} style={view.contributor.avatar ? { backgroundImage: `url('${view.contributor.avatar}')` } : undefined}>
                  {!view.contributor.avatar && view.contributor.name.charAt(0).toUpperCase()}
                </span>
                <small>Shared by {view.contributor.name}</small>
              </Link>
            )}
          </div>

          <div className="view-primary-actions">
            <button className={saved ? 'active' : ''} type="button" onClick={toggleSaved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /><span>{saved ? 'Saved' : 'Save'}</span></button>
            <button className={visited ? 'active' : ''} type="button" onClick={toggleVisited}><Check size={17} /><span>{visited ? 'Been here' : 'Been here?'}</span></button>
            <a href={directions} target="_blank" rel="noreferrer"><Navigation size={17} /><span>Directions</span></a>
          </div>

          <section className="stand-panel">
            <div className="stand-panel-head"><h2>Stand here</h2></div>
            <div className="stand-mini-map"><ViewpointMap coordinate={{ latitude: view.latitude, longitude: view.longitude }} ariaLabel={`Exact viewpoint for ${view.title}`} /><small>{view.coordinates}</small></div>
          </section>

          <section className="view-facts" aria-label="Useful details about this view">
            {view.capturedAtLocal && <div><span><small><CalendarDays /> {view.captureTimeSource === 'file' ? 'File dated' : 'Photographed'}</small><strong>{capturedAtLabel(view.capturedAtLocal)}</strong></span></div>}
            {view.bestTime && <div><span><small><Clock3 /> Best view</small><strong>{view.bestTime}</strong></span></div>}
            {view.accessSummary && <div><span><small><Footprints /> Getting there</small><strong>{view.accessSummary}</strong></span></div>}
            {view.difficulty && <div><span><small><Compass /> Effort</small><strong>{view.difficulty}</strong></span></div>}
          </section>

          {view.description && <p className="view-plain-description">{view.description}</p>}
          {view.tip && <section className="one-tip"><Sun size={18} /><div><small>Before you go</small><p>{view.tip}</p></div></section>}

          <section className="community-tip-section">
            <div className="discussion-heading"><div><h2>Talk with people who stood here</h2><p>Ask a question, add context, or share one useful detail.</p></div>{tips.length > 0 && <span>{tips.length} {tips.length === 1 ? 'message' : 'messages'}</span>}</div>
            <div className="discussion-thread">
              {tipThreads.map((tip) => <DiscussionItem key={tip.id} tip={tip} depth={0} canReply={threadingAvailable} replyingTo={replyingTo} replyBody={replyBody} onReply={startReply} onReplyBody={setReplyBody} onSubmitReply={addReply} onCancelReply={() => { setReplyingTo(null); setReplyBody(''); }} />)}
              {!tips.length && <div className="discussion-empty"><strong>Start the conversation.</strong><p>What would you want to know before standing here?</p></div>}
            </div>
            <div className="discussion-composer"><textarea value={tipBody} onChange={(event) => setTipBody(event.target.value)} maxLength={280} rows={2} placeholder="Add a useful detail or ask a question" /><button type="button" onClick={addTip} disabled={tipBody.trim().length < 4}>Post</button></div>
          </section>
        </aside>
      </div>

      {authOpen && <AuthDialog context="view" onClose={() => setAuthOpen(false)} />}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </main>
  );
}
