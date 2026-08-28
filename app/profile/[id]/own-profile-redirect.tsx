'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '../../supabase';

export default function OwnProfileRedirect({ profileId }: { profileId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const redirectIfOwner = (userId: string | null | undefined) => {
      if (userId === profileId) router.replace('/profile');
    };
    void supabase.auth.getUser().then(({ data }) => redirectIfOwner(data.user?.id));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => redirectIfOwner(session?.user.id));
    return () => data.subscription.unsubscribe();
  }, [profileId, router]);

  return null;
}
