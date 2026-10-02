import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CoinDetail from './pages/CoinDetail';

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/watchlist" element={<Dashboard initialTab="watchlist" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/coin/:id" element={<CoinDetail />} />
        </Routes>
      </div>
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-textMuted select-none">
        <p>Data from CoinGecko. Educational only — not financial advice.</p>
      </footer>
    </div>
  );
}
