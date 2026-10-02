import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { useCurrency } from './CurrencyContext';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const { user } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Ref to hold current alerts so intervals always see latest without recreating timer
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  // Add in-app toast notification with auto-dismiss
  const addToast = useCallback((toast) => {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch alerts for logged-in user
  const refreshAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      return [];
    }
    try {
      const res = await api.get('/alerts');
      const data = Array.isArray(res.data) ? res.data : [];
      setAlerts(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch alerts:', err.message);
      return [];
    }
  }, [user]);

  // Initial fetch and 60s polling for alerts
  useEffect(() => {
    if (!user) {
      setAlerts([]);
      return;
    }

    refreshAlerts();

    const intervalId = setInterval(refreshAlerts, 60000);
    return () => clearInterval(intervalId);
  }, [user, refreshAlerts]);

  // Request browser notification permission once when user has at least one alert
  useEffect(() => {
    const PERM_KEY = 'cryptopulse_alert_permission_requested';
    if (
      user &&
      alerts.length > 0 &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default' &&
      !localStorage.getItem(PERM_KEY)
    ) {
      localStorage.setItem(PERM_KEY, 'true');
      Notification.requestPermission().catch(() => {});
    }
  }, [user, alerts.length]);

  // 45s interval: fetch /api/coins and evaluate alerts against polled prices
  useEffect(() => {
    if (!user) return;

    async function checkCoins() {
      const currentAlerts = alertsRef.current;
      if (!currentAlerts || currentAlerts.length === 0) return;

      try {
        const res = await api.get('/coins', {
          params: { currency: currency ? currency.toLowerCase() : 'usd' }
        });
        const coins = Array.isArray(res.data) ? res.data : [];
        if (coins.length === 0) return;

        const triggered = [];

        for (const alert of currentAlerts) {
          const match = coins.find((c) => c.id === alert.coinId);
          if (!match || match.current_price === null || match.current_price === undefined) {
            continue;
          }

          const currentPrice = match.current_price;
          const isHit =
            (alert.direction === 'above' && currentPrice >= alert.targetPrice) ||
            (alert.direction === 'below' && currentPrice <= alert.targetPrice);

          if (isHit) {
            triggered.push({ alert, currentPrice, coin: match });
          }
        }

        if (triggered.length > 0) {
          for (const { alert, currentPrice, coin } of triggered) {
            const symbol = (alert.coinSymbol || alert.coinName || 'COIN').toUpperCase();
            const title = `${symbol} alert`;
            const priceStr = formatPrice ? formatPrice(currentPrice) : `$${currentPrice}`;
            const targetStr = formatPrice ? formatPrice(alert.targetPrice) : `$${alert.targetPrice}`;
            const body = `${alert.coinName} is now ${priceStr} (${alert.direction} ${targetStr})`;

            let shownBrowserNotification = false;
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              try {
                new Notification(title, {
                  body,
                  icon: coin?.image || undefined
                });
                shownBrowserNotification = true;
              } catch (err) {
                console.error('Notification error:', err);
              }
            }

            // In-app toast fallback when browser notification is denied/unsupported or failed
            if (!shownBrowserNotification) {
              addToast({
                title,
                message: body,
                direction: alert.direction,
                coinSymbol: symbol
              });
            }

            // One-shot: delete triggered alert from server
            api.delete(`/alerts/${alert._id}`).catch((err) => {
              console.error('Failed to delete triggered alert:', err);
            });
          }

          // Remove triggered alerts from local state
          const triggeredIds = new Set(triggered.map((t) => t.alert._id));
          setAlerts((prev) => prev.filter((a) => !triggeredIds.has(a._id)));
        }
      } catch (err) {
        console.error('Error checking coin prices for alerts:', err.message);
      }
    }

    const checkIntervalId = setInterval(checkCoins, 45000);
    return () => clearInterval(checkIntervalId);
  }, [user, currency, formatPrice, addToast]);

  // Add alert helper
  const addAlert = useCallback(
    async ({ coinId, coinName, coinSymbol, direction, targetPrice }) => {
      const res = await api.post('/alerts', {
        coinId,
        coinName,
        coinSymbol,
        direction,
        targetPrice
      });
      setAlerts((prev) => [res.data, ...prev]);
      return res.data;
    },
    []
  );

  // Remove alert helper
  const removeAlert = useCallback(async (alertId) => {
    await api.delete(`/alerts/${alertId}`);
    setAlerts((prev) => prev.filter((a) => a._id !== alertId));
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        alertsCount: alerts.length,
        addAlert,
        removeAlert,
        refreshAlerts,
        toasts,
        dismissToast
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
