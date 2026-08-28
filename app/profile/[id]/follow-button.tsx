'use client';

import Link from 'next/link';
import { Check, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import AuthDialog from '../../auth-dialog';
import { getSupabaseBrowserClient } from '../../supabase';

export default function FollowButton({ profileId, initialFollowerCount }: { profileId: string; initialFollowerCount: number }) {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    const applyUser = async (userId: string | null) => {
      if (!active) return;
      setViewerId(userId);
      if (!userId || userId === profileId) {
        setFollowing(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId).eq('following_id', profileId).maybeSingle();
      if (!active) return;
      setFollowing(Boolean(data));
      setLoading(false);
    };

    void supabase.auth.getUser().then(({ data }) => applyUser(data.user?.id || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { void applyUser(session?.user.id || null); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [profileId]);

  const toggleFollow = async () => {
    if (!viewerId) return setAuthOpen(true);
    if (viewerId === profileId || loading) return;

    const next = !following;
    setFollowing(next);
    setFollowerCount((count) => Math.max(0, count + (next ? 1 : -1)));
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = next
      ? await supabase.from('follows').insert({ follower_id: viewerId, following_id: profileId })
      : await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', profileId);
    if (error) {
      setFollowing(!next);
      setFollowerCount((count) => Math.max(0, count + (next ? -1 : 1)));
    }
    setLoading(false);
  };

  return (
    <div className="public-profile-action">
      <span><strong>{followerCount}</strong> {followerCount === 1 ? 'follower' : 'followers'}</span>
      {viewerId === profileId ? (
        <Link href="/profile">Edit profile</Link>
      ) : (
        <button className={following ? 'following' : ''} type="button" onClick={() => void toggleFollow()} disabled={loading}>
          {following ? <><Check size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
        </button>
      )}
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
