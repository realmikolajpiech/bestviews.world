'use client';

import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../supabase';

export default function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) return setError('Passwords do not match.');
    setLoading(true);
    const { error: authError } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setLoading(false);
    if (authError) setError(authError.message);
    else setComplete(true);
  };

  return (
    <main className="auth-reset-page">
      <Link className="auth-reset-brand" href="/"><ArrowLeft size={17} /> BestViews.world</Link>
      <section className="auth-reset-card">
        <img src="/bestviews-logo.png" alt="" />
        {complete ? (
          <div className="auth-reset-complete">
            <span><Check size={22} /></span>
            <h1>Password updated.</h1>
            <p>You can return to BestViews.world. You are already signed in.</p>
            <Link href="/">Return to your views</Link>
          </div>
        ) : (
          <>
            <h1>Choose a new password.</h1>
            <p>{ready ? 'Use at least 8 characters.' : 'Open the password reset link from your email to continue.'}</p>
            {ready && (
              <form className="email-auth" onSubmit={(event) => void updatePassword(event)}>
                <div className="auth-field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required autoFocus /></div>
                <div className="auth-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required /></div>
                <button className="email-auth-submit" type="submit" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
              </form>
            )}
            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          </>
        )}
      </section>
    </main>
  );
}
