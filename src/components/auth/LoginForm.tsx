'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'signin' | 'signup' | 'guest';

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('signin');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [guestName, setGuestName] = useState('');

  const handleGoogle = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(signInEmail.trim(), signInPassword);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (signUpPassword !== signUpConfirm) { setError('Passwords do not match'); return; }
    if (signUpPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(signUpName.trim(), signUpEmail.trim(), signUpPassword);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) { setError('Please enter a display name'); return; }
    setError(null);
    setLoading(true);
    try {
      await signInAsGuest(guestName.trim());
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const isAnyLoading = loading || loadingGoogle;

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-white">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Trademarkia Sheets</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time collaborative spreadsheets</p>
        </div>

        <Button onClick={() => void handleGoogle()} disabled={isAnyLoading} className="mb-6 w-full gap-2">
          {loadingGoogle ? <Spinner size="sm" /> : null}
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2">or</span>
          </div>
        </div>

        <div className="mb-5 flex rounded-lg border border-gray-200 p-1">
          {(['signin', 'signup', 'guest'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'signin' ? 'Sign In' : t === 'signup' ? 'Sign Up' : 'Guest'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {tab === 'signin' && (
          <form onSubmit={(e) => void handleSignIn(e)} className="flex flex-col gap-3">
            <Input type="email" placeholder="Email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required disabled={isAnyLoading} />
            <Input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required disabled={isAnyLoading} />
            <Button type="submit" disabled={isAnyLoading} className="gap-2">
              {loading ? <Spinner size="sm" /> : null}Sign In
            </Button>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={(e) => void handleSignUp(e)} className="flex flex-col gap-3">
            <Input type="text" placeholder="Full name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required maxLength={60} disabled={isAnyLoading} />
            <Input type="email" placeholder="Email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required disabled={isAnyLoading} />
            <Input type="password" placeholder="Password (min 6 chars)" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required disabled={isAnyLoading} />
            <Input type="password" placeholder="Confirm password" value={signUpConfirm} onChange={(e) => setSignUpConfirm(e.target.value)} required disabled={isAnyLoading} />
            <Button type="submit" disabled={isAnyLoading} className="gap-2">
              {loading ? <Spinner size="sm" /> : null}Create Account
            </Button>
          </form>
        )}

        {tab === 'guest' && (
          <form onSubmit={(e) => void handleGuest(e)} className="flex flex-col gap-3">
            <Input type="text" placeholder="Your display name" value={guestName} onChange={(e) => setGuestName(e.target.value)} maxLength={40} required disabled={isAnyLoading} />
            <Button type="submit" variant="outline" disabled={isAnyLoading || !guestName.trim()} className="gap-2">
              {loading ? <Spinner size="sm" /> : null}Join as Guest
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
