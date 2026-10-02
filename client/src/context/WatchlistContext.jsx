import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync watchlist when user state changes
  useEffect(() => {
    if (!token || !user) {
      setWatchlist([]);
      return;
    }

    // If user object already has watchlist, seed it immediately
    if (Array.isArray(user.watchlist)) {
      setWatchlist(user.watchlist);
    }

    // Fetch fresh watchlist from server
    let isMounted = true;
    setLoading(true);

    api
      .get('/watchlist')
      .then((res) => {
        if (isMounted && res.data?.watchlist) {
          setWatchlist(res.data.watchlist);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch watchlist:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const isStarred = useCallback(
    (coinId) => {
      if (!coinId) return false;
      return watchlist.includes(coinId.toLowerCase());
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    async (coinId) => {
      if (!coinId) return;
      const cleanId = coinId.toLowerCase();

      // Guests clicking star are redirected to /login per Task 9 spec
      if (!user || !token) {
        navigate('/login');
        return;
      }

      const alreadyStarred = watchlist.includes(cleanId);
      const previousWatchlist = [...watchlist];

      // Optimistic update
      if (alreadyStarred) {
        setWatchlist((prev) => prev.filter((id) => id !== cleanId));
      } else {
        setWatchlist((prev) => [...prev, cleanId]);
      }

      try {
        if (alreadyStarred) {
          const res = await api.delete(`/watchlist/${encodeURIComponent(cleanId)}`);
          if (res.data?.watchlist) {
            setWatchlist(res.data.watchlist);
          }
        } else {
          const res = await api.post(`/watchlist/${encodeURIComponent(cleanId)}`);
          if (res.data?.watchlist) {
            setWatchlist(res.data.watchlist);
          }
        }
      } catch (err) {
        console.error('Failed to update watchlist:', err.message);
        // Rollback on failure
        setWatchlist(previousWatchlist);
      }
    },
    [user, token, watchlist, navigate]
  );

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isStarred,
        toggleWatchlist,
        loading
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
