'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { getSupabaseBrowserClient } from './supabase';

type AuthMode = 'signin' | 'signup' | 'forgot';

function friendlyAuthError(message: string) {
  if (message.toLowerCase().includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (message.toLowerCase().includes('user already registered')) return 'An account already exists for this email.';
  return message;
}

export default function AuthDialog({ onClose, context = 'general' }: { onClose: () => void; context?: 'general' | 'view' }) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 190);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  useEffect(() => {
    const releasePendingAuth = () => setLoading(false);
    const handleVisibility = () => { if (document.visibilityState === 'visible') releasePendingAuth(); };
    window.addEventListener('pageshow', releasePendingAuth);
    window.addEventListener('focus', releasePendingAuth);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pageshow', releasePendingAuth);
      window.removeEventListener('focus', releasePendingAuth);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const resetFeedback = () => { setError(null); setNotice(null); };
  const changeMode = (next: AuthMode) => { resetFeedback(); setPassword(''); setMode(next); };

  const continueWithGoogle = async () => {
    resetFeedback();
    setLoading(true);
    const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    if (authError) { setError(friendlyAuthError(authError.message)); setLoading(false); }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'forgot') {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/auth/reset-password` });
      setLoading(false);
      if (authError) setError(friendlyAuthError(authError.message));
      else setNotice('Password reset link sent. Check your email.');
      return;
    }

    if (mode === 'signup') {
      const { data, error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: window.location.href } });
      setLoading(false);
      if (authError) setError(friendlyAuthError(authError.message));
      else if (data.session) requestClose();
      else setNotice('Check your email to confirm your account.');
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setLoading(false);
    if (authError) setError(friendlyAuthError(authError.message));
    else requestClose();
  };

  const heading = mode === 'signup' ? 'Create your account.' : mode === 'forgot' ? 'Reset your password.' : context === 'view' ? 'Keep this view with you.' : 'Keep your views with you.';
  const intro = mode === 'signup' ? 'Save places, remember where you have been, and share your own viewpoints.' : mode === 'forgot' ? 'We will email you a secure link to choose a new password.' : context === 'view' ? 'Sign in to save it, mark it visited, or leave a practical tip.' : 'Save places, remember where you have been, and share your own viewpoints.';

  return (
    <div className={`modal-backdrop ${closing ? 'is-closing' : ''}`} role="presentation" onMouseDown={requestClose}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-label={mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Reset password' : 'Sign in'} onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={requestClose} aria-label="Close"><X size={18} /></button>
        <img src="/bestviews-logo.png" alt="" />
        <h2>{heading}</h2>
        <p>{intro}</p>

        {mode !== 'forgot' && (
          <>
            <div className="oauth-actions">
              <button type="button" disabled={loading} onClick={() => void continueWithGoogle()}>
                <span className="oauth-button-content"><FcGoogle size={21} aria-hidden="true" /><span>Continue with Google</span></span>
              </button>
            </div>
            <div className="auth-divider"><span>or</span></div>
          </>
        )}

        <form className="email-auth" onSubmit={(event) => void submitEmail(event)}>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required autoFocus={mode === 'forgot'} placeholder="you@example.com" />
          </div>
          {mode !== 'forgot' && (
            <div className="auth-field">
              <div className="auth-field-head"><label htmlFor="auth-password">Password</label>{mode === 'signin' && <button type="button" onClick={() => changeMode('forgot')}>Forgot?</button>}</div>
              <input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required placeholder="At least 8 characters" />
            </div>
          )}
          <button className="email-auth-submit" type="submit" disabled={loading}>{loading ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}</button>
        </form>

        {error && <p className="auth-message auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}

        <p className="auth-switch">
          {mode === 'signin' && <>New here? <button type="button" onClick={() => changeMode('signup')}>Create account</button></>}
          {mode === 'signup' && <>Already have an account? <button type="button" onClick={() => changeMode('signin')}>Sign in</button></>}
          {mode === 'forgot' && <button type="button" onClick={() => changeMode('signin')}>Back to sign in</button>}
        </p>
        <p className="auth-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</p>
      </section>
    </div>
  );
}
