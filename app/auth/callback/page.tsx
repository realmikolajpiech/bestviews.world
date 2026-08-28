'use client';

import Link from 'next/link';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../supabase';

function safeDestination(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const finishSignIn = async () => {
      const returnUrl = new URL(window.location.href);
      const hashParams = new URLSearchParams(returnUrl.hash.slice(1));
      const callbackError = returnUrl.searchParams.get('error_description') || hashParams.get('error_description');

      if (callbackError) {
        if (active) setError(callbackError);
        return;
      }

      const { data, error: sessionError } = await getSupabaseBrowserClient().auth.getSession();

      if (sessionError || !data.session) {
        if (active) setError(sessionError?.message || 'Google did not return a sign-in session. Please try again.');
        return;
      }

      window.location.replace(safeDestination(returnUrl.searchParams.get('next')));
    };

    void finishSignIn();
    return () => { active = false; };
  }, []);

  return (
    <main className="auth-callback-page">
      {error ? (
        <>
          <Link className="auth-reset-brand" href="/">
            <img src="/bestviews-logo.png" alt="" />
            <span>BestViews.world</span>
          </Link>
          <section className="auth-callback-card" role="alert">
            <AlertCircle aria-hidden="true" />
            <h1>Sign-in didn’t work.</h1>
            <p>{error}</p>
            <Link href="/">Try again</Link>
          </section>
        </>
      ) : (
        <div className="auth-callback-mark" role="status" aria-label="Signing you in">
          <span><LoaderCircle aria-hidden="true" /></span>
          <img src="/bestviews-logo.png" alt="" />
        </div>
      )}
    </main>
  );
}
