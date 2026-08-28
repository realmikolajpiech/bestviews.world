import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MapPin, Plus, UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '../../supabase';
import { rowToViewpoint, type Viewpoint, type ViewpointRow } from '../../view-data';
import FollowButton from './follow-button';

const viewpointSelect = '*, profiles!viewpoints_contributor_id_fkey(id, display_name, avatar_url)';

type PublicProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  social_url: string | null;
};

async function getPublicProfile(id: string) {
  try {
    const supabase = createSupabaseServerClient();
    const [profileResult, viewpointsResult, followersResult, followingResult] = await Promise.all([
      supabase.from('profiles').select('id, display_name, avatar_url, bio, location, social_url').eq('id', id).maybeSingle(),
      supabase.from('viewpoints').select(viewpointSelect).eq('contributor_id', id).eq('status', 'published').order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
    ]);

    if (profileResult.error || !profileResult.data) return null;
    return {
      profile: profileResult.data as PublicProfile,
      viewpoints: (viewpointsResult.data || []).map((row) => rowToViewpoint(row as ViewpointRow)).filter((view) => view.image),
      followerCount: followersResult.count || 0,
      followingCount: followingResult.count || 0,
    };
  } catch {
    return null;
  }
}

function ViewCard({ view }: { view: Viewpoint }) {
  return (
    <article className="profile-view-card">
      <Link href={`/views/${view.slug}`} className="profile-view-photo" style={{ backgroundImage: `url('${view.image}')` }} />
      <div>
        <h2><Link href={`/views/${view.slug}`}>{view.title}</Link></h2>
        <p><MapPin size={14} /> {view.region}, {view.country}</p>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicProfile(id);
  if (!result) return { title: 'Profile — BestViews.world' };
  return {
    title: `${result.profile.display_name}'s views — BestViews.world`,
    description: `View places shared by ${result.profile.display_name}.`,
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicProfile(id);
  if (!result) notFound();

  const { profile, viewpoints, followerCount, followingCount } = result;
  const firstName = profile.display_name.split(/\s+/)[0];
  const socialLabel = profile.social_url ? (() => {
    try { return new URL(profile.social_url).hostname.replace(/^www\./, ''); } catch { return 'Social link'; }
  })() : null;

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <Link className="profile-brand" href="/"><img src="/bestviews-logo.png" alt="" /><span>BestViews<span>.world</span></span></Link>
        <nav>
          <Link href="/"><ArrowLeft size={17} /> Discover</Link>
          <Link className="profile-share" href="/?share=1">Share a view <Plus size={16} /></Link>
        </nav>
      </header>

      <div className="profile-content public-profile-content">
        <section className="profile-hero public-profile-hero social-profile-hero">
          <div className={`profile-avatar ${profile.avatar_url ? 'has-image' : ''}`} style={profile.avatar_url ? { backgroundImage: `url('${profile.avatar_url}')` } : undefined}>
            {!profile.avatar_url && profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-intro">
            <div className="profile-name-line"><h1>{profile.display_name}</h1></div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.location && <span><MapPin size={14} /> {profile.location}</span>}
              {profile.social_url && <a href={profile.social_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {socialLabel}</a>}
            </div>
            <div className="profile-social-stats">
              <span><strong>{viewpoints.length}</strong><small>Shared</small></span>
              <span><strong>{followingCount}</strong><small>Following</small></span>
            </div>
          </div>
          <FollowButton profileId={profile.id} initialFollowerCount={followerCount} />
        </section>

        {viewpoints.length ? (
          <section className="profile-view-grid public-profile-grid">
            {viewpoints.map((view) => <ViewCard key={view.id} view={view} />)}
          </section>
        ) : (
          <div className="profile-empty public-profile-empty">
            <span><UserRound size={24} /></span>
            <h2>{firstName} hasn’t shared a view yet.</h2>
            <Link href="/">Discover views</Link>
          </div>
        )}
      </div>
    </main>
  );
}
