import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab] = useState('login'); // 'login' or 'signup'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent double-submission
    setError('');

    if (!identifier.trim()) {
      setError('Email or username is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (tab === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      if (tab === 'login') {
        await login(identifier.trim(), password);
      } else {
        await signup(identifier.trim(), password);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'An unexpected error occurred. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] bg-surface border border-border rounded-lg p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-bull/30 flex items-center justify-center text-bull text-xs font-bold">
              ▲
            </div>
            <span className="font-bold text-lg text-text">CryptoPulse</span>
          </Link>
          <p className="text-xs text-textMuted">
            Real-time top 100 crypto intelligence and momentum indicators
          </p>
        </div>

        {/* Tabs: Sign in / Sign up */}
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative cursor-pointer ${
              tab === 'login' ? 'text-text' : 'text-textMuted hover:text-text'
            }`}
          >
            Sign in
            {tab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative cursor-pointer ${
              tab === 'signup' ? 'text-text' : 'text-textMuted hover:text-text'
            }`}
          >
            Sign up
            {tab === 'signup' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-bear/10 border border-bear/30 text-bear text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-textMuted mb-1.5" htmlFor="identifier">
              Email or username
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. alex or alex@example.com"
              className="w-full px-3 py-2 bg-surface2 border border-border rounded-md text-sm text-text placeholder-textFaint focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textMuted mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === 'signup' ? 'At least 8 characters' : '••••••••'}
              className="w-full px-3 py-2 bg-surface2 border border-border rounded-md text-sm text-text placeholder-textFaint focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 px-4 bg-accent text-bg font-semibold text-sm rounded-md hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4 text-bg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {submitting
                ? tab === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : tab === 'login'
                ? 'Sign in'
                : 'Create account'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
