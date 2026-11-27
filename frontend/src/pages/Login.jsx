import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import FindlyLogo from '../components/FindlyLogo';
import { signIn } from '../lib/auth';
import { navigate } from '../lib/router';

export default function Login({ mode: initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  const finish = (details) => {
    setLoading(true);
    signIn(details);
    setTimeout(() => navigate('/app'), 250);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (isSignup && !name.trim()) return setError('Enter your name.');
    finish({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <a href="#/"><FindlyLogo /></a>
        <a href="#/" className="btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /> Back to home</a>
      </div>

      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-16 md:pt-16">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900">
            {isSignup ? 'Create your account' : 'Sign in to Findly AI'}
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            {isSignup ? 'Start investigating incidents in under a minute.' : 'Welcome back. Pick up where you left off.'}
          </p>

          <div className="card mt-8 p-6">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {isSignup && (
                <div>
                  <label className="label" htmlFor="name">Full name</label>
                  <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
                </div>
              )}
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="label" htmlFor="password">Password</label>
                </div>
                <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} />
              </div>
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSignup ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button className="btn-secondary w-full py-2.5" disabled={loading} onClick={() => finish({ name: 'Demo Engineer', email: 'demo@findly.ai' })}>
              Continue with demo account
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isSignup ? 'Already have an account? ' : 'New to Findly AI? '}
            <button className="font-medium text-brand-600 hover:underline" onClick={() => { setError(''); setMode(isSignup ? 'signin' : 'signup'); }}>
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-4 text-center text-xs text-slate-400">
            Demo workspace: your session is kept in this browser only.
          </p>
        </div>
      </main>
    </div>
  );
}
