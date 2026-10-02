import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const location = useLocation();

  const isMarketsActive = location.pathname === '/' || location.pathname.startsWith('/coin/');

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand logo & Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-bull/30 flex items-center justify-center text-bull font-bold text-sm">
              ▲
            </div>
            <span className="font-bold text-base tracking-tight text-text group-hover:text-accent transition-colors">
              CryptoPulse
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isMarketsActive
                  ? 'text-text bg-surface2'
                  : 'text-textMuted hover:text-text hover:bg-surface2/50'
              }`}
            >
              Markets
            </Link>
            <span
              className="px-3 py-1.5 text-sm font-medium text-textFaint flex items-center gap-1.5 cursor-not-allowed select-none"
              title="Watchlist coming soon"
            >
              Watchlist
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface2 text-textMuted uppercase tracking-wider font-semibold">
                Soon
              </span>
            </span>
          </nav>
        </div>

        {/* Right: Currency Selector & Auth State */}
        <div className="flex items-center gap-3">
          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-surface2 border border-border text-xs text-text font-semibold rounded-md px-2.5 py-1.5 focus:outline-none focus:border-accent cursor-pointer transition-colors"
              aria-label="Select Currency"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-surface text-text">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface2 border border-border/60">
                <div className="w-2 h-2 rounded-full bg-bull"></div>
                <span className="text-xs font-medium text-text truncate max-w-[140px] sm:max-w-[200px]">
                  {user.identifier}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-medium text-textMuted hover:text-text rounded-md border border-border hover:bg-surface2 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-md bg-accent text-bg font-semibold text-xs hover:bg-white/90 transition-colors shadow-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
