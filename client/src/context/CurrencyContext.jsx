import React, { createContext, useContext, useState, useMemo } from 'react';

const CurrencyContext = createContext(null);

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'en-IE' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)', locale: 'en-IN' },
  { code: 'AED', symbol: 'AED', label: 'AED (AED)', locale: 'en-AE' }
];

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem('cryptopulse_currency');
    const match = SUPPORTED_CURRENCIES.find((c) => c.code === saved);
    return match ? match.code : 'USD';
  });

  const setCurrency = (newCurrency) => {
    const match = SUPPORTED_CURRENCIES.find((c) => c.code === newCurrency);
    const validCode = match ? match.code : 'USD';
    setCurrencyState(validCode);
    localStorage.setItem('cryptopulse_currency', validCode);
  };

  const currentConfig = useMemo(() => {
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === currency) ||
      SUPPORTED_CURRENCIES[0]
    );
  }, [currency]);

  // Formatters adapted to current currency
  const formatters = useMemo(() => {
    const { code, locale } = currentConfig;

    const standard = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const subUnit = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    });

    const compact = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      notation: 'compact',
      maximumFractionDigits: 2
    });

    return { standard, subUnit, compact };
  }, [currentConfig]);

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '—';
    if (Math.abs(price) >= 1) {
      return formatters.standard.format(price);
    }
    return formatters.subUnit.format(price);
  };

  const formatVolumeOrCap = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return formatters.compact.format(value);
  };

  const value = {
    currency,
    setCurrency,
    currentConfig,
    currencySymbol: currentConfig.symbol,
    currencies: SUPPORTED_CURRENCIES,
    formatPrice,
    formatVolumeOrCap
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
