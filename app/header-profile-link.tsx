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

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  const image = avatarUrl(user);
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
