'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from './supabase';

function avatarUrl(user: User | null) {
  const value = user?.user_metadata.avatar_url || user?.user_metadata.picture;
  return typeof value === 'string' && value ? value : null;
}

export default function HeaderProfileLink() {
  const [user, setUser] = useState<User | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    const applyUser = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) return setProfileAvatar(null);
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', nextUser.id).maybeSingle();
      if (active) setProfileAvatar(typeof data?.avatar_url === 'string' ? data.avatar_url : null);
    };
    const handleAvatarUpdate = (event: Event) => setProfileAvatar((event as CustomEvent<string | null>).detail);
    void supabase.auth.getUser().then(({ data }) => void applyUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void applyUser(session?.user || null));
    window.addEventListener('profile-avatar-updated', handleAvatarUpdate);
    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.removeEventListener('profile-avatar-updated', handleAvatarUpdate);
    };
  }, []);

  const image = profileAvatar || avatarUrl(user);
  return (
    <Link className="avatar persistent-profile-avatar" href="/profile" aria-label="Open your profile" aria-current="page">
      {image
        ? <img src={image} alt="" />
        : user
          ? String(user.user_metadata.full_name || user.email || 'T').charAt(0).toUpperCase()
          : <UserRound size={18} />}
    </Link>
  );
}
