import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAlerts } from '../context/AlertContext';

export default function CoinAlertCard({ coin }) {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { alerts, addAlert, removeAlert } = useAlerts();

  const [direction, setDirection] = useState('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [removingId, setRemovingId] = useState(null);

  // Pre-fill target price with coin's current price when coin loads or changes
  useEffect(() => {
    if (coin?.current_price && !targetPrice) {
      setTargetPrice(String(coin.current_price));
    }
  }, [coin?.current_price]);

  // Reset form message when coin changes
  useEffect(() => {
    setFormMessage(null);
  }, [coin?.id]);

  // Filter alerts for this coin only
  const coinAlerts = (alerts || []).filter((a) => a.coinId === coin?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coin || !user) return;

    const parsedPrice = parseFloat(targetPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormMessage({
        type: 'error',
        text: 'Please enter a valid positive target price.'
      });
      return;
    }

    setSubmitting(true);
    setFormMessage(null);

    try {
      await addAlert({
        coinId: coin.id,
        coinName: coin.name,
        coinSymbol: coin.symbol,
        direction,
        targetPrice: parsedPrice
      });

      // On success: confirmation message and clear/reset the form
      setFormMessage({
        type: 'success',
        text: `Alert created! You'll be notified when ${coin.name} goes ${direction} ${formatPrice(parsedPrice)}.`
      });
      setTargetPrice(coin.current_price ? String(coin.current_price) : '');
    } catch (err) {
      if (err.response?.status === 409) {
        setFormMessage({
          type: 'error',
          text: err.response.data?.error || 'Alert limit reached (20)'
        });
      } else {
        setFormMessage({
          type: 'error',
          text: "Couldn't set alert, try again."
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (alertId) => {
    setRemovingId(alertId);
    try {
      await removeAlert(alertId);
    } catch (err) {
      console.error('Failed to remove alert:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      {/* Label */}
      <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-2.5 flex items-center justify-between">
        <span>Set Price Alert</span>
        {user && (
          <span className="text-textFaint text-[10px]">
            {coinAlerts.length} active for {coin?.symbol?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Guest state */}
      {!user ? (
        <div>
          <p className="text-xs text-textMuted leading-relaxed mb-3.5">
            Get instant one-shot alerts when {coin?.name || 'this coin'} reaches your target price.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-2 px-3 rounded-lg text-xs font-semibold bg-surface2 border border-border text-text hover:border-accent hover:text-accent transition-colors"
          >
            Log in to set alerts →
          </Link>
        </div>
      ) : (
        /* Logged-in alert form */
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Direction toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-bg border border-border rounded-lg">
            <button
              type="button"
              onClick={() => {
                setDirection('above');
                setFormMessage(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                direction === 'above'
                  ? 'bg-surface2 text-bull shadow-sm'
                  : 'text-textMuted hover:text-text'
              }`}
            >
              <span className="text-[10px]">▲</span> Price goes above
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection('below');
                setFormMessage(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                direction === 'below'
                  ? 'bg-surface2 text-bear shadow-sm'
                  : 'text-textMuted hover:text-text'
              }`}
            >
              <span className="text-[10px]">▼</span> Price goes below
            </button>
          </div>

          {/* Target price input */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <label htmlFor="targetPriceInput" className="text-textMuted font-medium">
                Target Price
              </label>
              {coin?.current_price && (
                <button
                  type="button"
                  onClick={() => setTargetPrice(String(coin.current_price))}
                  className="text-[11px] text-textFaint hover:text-text cursor-pointer transition-colors"
                  title="Click to reset to current price"
                >
                  Current: {formatPrice(coin.current_price)}
                </button>
              )}
            </div>
            <input
              id="targetPriceInput"
              type="number"
              step="any"
              min="0"
              required
              value={targetPrice}
              onChange={(e) => {
                setTargetPrice(e.target.value);
                setFormMessage(null);
              }}
              placeholder={coin?.current_price ? String(coin.current_price) : '0.00'}
              className="w-full bg-bg border border-border text-text text-xs sm:text-sm rounded-lg px-3 py-2 font-mono tabular-nums focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !targetPrice}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-accent text-bg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Setting Alert...' : 'Set Alert'}
          </button>

          {/* Status Message */}
          {formMessage && (
            <div
              className={`p-2 rounded-lg text-xs font-medium leading-snug border ${
                formMessage.type === 'success'
                  ? 'bg-bull/10 border-bull/30 text-bull'
                  : 'bg-bear/10 border-bear/30 text-bear'
              }`}
            >
              {formMessage.text}
            </div>
          )}

          {/* Active alerts for this coin */}
          {coinAlerts.length > 0 && (
            <div className="pt-3 border-t border-border/60">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-textMuted mb-2 flex items-center justify-between">
                <span>Active Alerts</span>
                <span className="text-textFaint font-normal">({coinAlerts.length})</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {coinAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="flex items-center justify-between gap-2 p-2 bg-surface2 rounded-lg border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          alert.direction === 'above' ? 'text-bull' : 'text-bear'
                        }`}
                      >
                        {alert.direction === 'above' ? '▲ Above' : '▼ Below'}
                      </span>
                      <span className="font-semibold tabular-nums text-text truncate">
                        {formatPrice(alert.targetPrice)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={removingId === alert._id}
                      onClick={() => handleRemove(alert._id)}
                      className="text-[11px] font-semibold text-textMuted hover:text-bear transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      title="Remove alert"
                    >
                      {removingId === alert._id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
