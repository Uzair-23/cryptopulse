# CryptoPulse — Real-Time Cryptocurrency Intelligence Dashboard

CryptoPulse is a modern, responsive cryptocurrency analytics platform and dashboard for monitoring the top 100 cryptocurrencies by market capitalization. Built with a high-performance MERN architecture (Express, MongoDB, React, Vite, Tailwind CSS), it provides real-time market data, advanced dual-charting (interactive line & candlestick charts with SMA/RSI indicators), multi-coin normalized comparisons, AI-powered market insights, real-time sentiment gauges, one-shot price alerts, and personalized watchlists.

---

## Key Features

### 1. Market Dashboard & Live Ticker
- **Top 100 Cryptocurrencies**: Track real-time prices, 24h volume, market cap, rank, and 1h / 24h / 7d percentage changes.
- **Smart Filtering & Search**: Instant client-side search by coin name or symbol with tabbed filters: *All Coins*, *Watchlist*, *Top Gainers*, and *Top Losers*.
- **Interactive 7-Day Sparklines**: Responsive full-width sparkline charts on every coin card with net-change color coding.
- **Infinite Ticker Tape**: Smooth marquee ticker pinned to the top, displaying the top 15 coins with real-time green/red price flash animations.
- **Auto-Polling**: Fresh data polled client-side every 45 seconds without browser socket overhead.

### 2. Dual-Engine Charting
- **Normalized Line / Area Chart (Recharts)**:
  - 4 flexible timeframes: `24H`, `7D`, `30D`, and `1Y`.
  - Multi-Coin Comparison: Overlay any second cryptocurrency normalized to percent change from the timeframe's baseline price.
- **TradingView Candlestick Chart (Lightweight Charts)**:
  - Precise OHLC candles rendered with high-performance Canvas via TradingView's `lightweight-charts`.
  - **Technical Indicator Overlays**: Independently toggleable **SMA (20)**, **SMA (50)**, and sub-pane **RSI (14)** calculated client-side via `technicalindicators`.

### 3. AI Insights & Sentiment Analysis
- **AI Market Summaries (Groq LLM)**: Synthesizes top market trends, volume movements, and gainer/loser dynamics into concise insights with bullet observations.
- **Per-Coin AI Insights**: Automatically generates focused commentary and statistics for individual coins on the detail view.
- **Fear & Greed Index**: Visual gradient sentiment gauge (0–100) powered by Alternative.me data with cached fallback.
- **Zero-Hallucination Grounding**: AI prompts strictly constrain output to verified numerical stats.

### 4. Smart Price Alerts & Watchlist
- **One-Shot Price Alerts**: Set target thresholds (`Above` or `Below`). Automatically checks against polled market data and notifies the user once, then self-deletes.
- **Dual Notification Delivery**: Native browser desktop notifications with seamless in-app animated toast notifications fallback.
- **Personalized Watchlists**: Star and persist monitored cryptocurrencies to user accounts in MongoDB Atlas.

### 5. Rule-Based Market Signals
- **Momentum Signal Engine**: Client-side rule engine evaluating 1h, 24h, and 7d momentum to output `Bullish`, `Neutral`, or `Bearish` pills with transparent human-readable explanations.
- **Educational Disclaimer**: Persistent notice displayed alongside all automated signals.

### 6. Multi-Currency Support & Responsive UI
- **7 Supported Currencies**: Switch seamlessly between `USD ($)`, `EUR (€)`, `GBP (£)`, `JPY (¥)`, `INR (₹)`, `CAD ($)`, and `AUD ($)`.
- **Responsive Layout**: Tailored for mobile phones (320px+), tablets, and widescreen desktop displays.
- **Accessible Dark Design**: Follows fintech terminal aesthetics using subtle borders, high-contrast readable typography (Inter), and dual glyph + color direction indicators (`▲` / `▼`).

---

## Tech Stack

### Frontend (`client/`)
- **Core**: React 18 (Vite, plain JavaScript)
- **Styling**: Tailwind CSS & Vanilla CSS Design Tokens
- **Routing**: React Router DOM (v7)
- **Charts**:
  - Recharts (Area / Line charts & normalized comparisons)
  - TradingView Lightweight Charts (v5 Candlesticks)
- **Indicators**: `technicalindicators` (SMA, RSI)
- **HTTP Client**: Axios

### Backend (`server/`)
- **Runtime**: Node.js & Express
- **Database**: MongoDB Atlas with Mongoose ODM
- **Caching**: `node-cache` (in-memory multi-tiered caching with stale-while-revalidate fallbacks)
- **Authentication**: JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
- **External Data**: CoinGecko API (public proxy), Alternative.me (Sentiment), Groq SDK (AI generation)
- **Security & Middleware**: `cors`, `dotenv`

---

## Project Structure

```text
cryptopulse/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static assets (favicons, SVGs)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AiCoinInsightCard.jsx
│   │   │   ├── AiSummaryCard.jsx
│   │   │   ├── AlertWatcher.jsx
│   │   │   ├── CandleChart.jsx
│   │   │   ├── CoinAlertCard.jsx
│   │   │   ├── CoinCard.jsx
│   │   │   ├── CoinIcon.jsx
│   │   │   ├── FearGreedCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Pill.jsx
│   │   │   ├── PriceChange.jsx
│   │   │   ├── SectionLabel.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── Sparkline.jsx
│   │   │   └── TickerTape.jsx
│   │   ├── context/            # Global React Contexts
│   │   │   ├── AlertContext.jsx
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CurrencyContext.jsx
│   │   │   └── WatchlistContext.jsx
│   │   ├── lib/                # Utilities & API client
│   │   │   ├── api.js
│   │   │   ├── normalize.js
│   │   │   └── recommendation.js
│   │   ├── pages/              # Application views
│   │   │   ├── CoinDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── App.jsx             # Main router & layout shell
│   │   ├── index.css           # Tailwind & design token variables
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── middleware/         # Auth & validation middleware
│   │   │   └── auth.js
│   │   ├── models/             # Mongoose Schemas
│   │   │   ├── Alert.js
│   │   │   └── User.js
│   │   ├── routes/             # Express API Endpoints
│   │   │   ├── ai.js
│   │   │   ├── alerts.js
│   │   │   ├── auth.js
│   │   │   ├── coins.js
│   │   │   ├── sentiment.js
│   │   │   └── watchlist.js
│   │   ├── services/           # Data & upstream integration services
│   │   │   ├── coingecko.js
│   │   │   ├── groq.js
│   │   │   ├── marketStats.js
│   │   │   └── sentiment.js
│   │   └── index.js            # Server entry point & DB connection
│   ├── package.json
│   └── .env.example
│
├── docs/                       # Specifications & design documentation
│   ├── DESIGN.md               # Design tokens, typography & aesthetics
│   ├── PLAN.md                 # Implementation task logs
│   └── PRD.md                  # Product requirement document
├── AGENTS.md                   # AI Assistant development guidelines
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: A running local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster connection string.
- *(Optional)* **Groq API Key**: For AI market and coin summaries.
- *(Optional)* **CoinGecko Demo API Key**: If using a higher-rate-limit demo plan.

---

### Installation & Local Setup

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/cryptopulse.git
cd cryptopulse
```

#### 2. Backend Setup (`server/`)
```bash
cd server
npm install
```

Create a `.env` file in `server/.env`:
```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cryptopulse?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173

# Optional:
COINGECKO_API_KEY=
GROQ_API_KEY=
```

Start the backend development server:
```bash
npm run dev
# Server starts on http://localhost:4000
```

#### 3. Frontend Setup (`client/`)
In a new terminal window:
```bash
cd client
npm install
npm run dev
# Vite server starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### Authentication
- `POST /api/auth/signup` — Register with username/email and password (min 8 chars). Returns JWT.
- `POST /api/auth/login` — Sign in with identifier and password. Returns JWT.
- `GET /api/auth/me` — *(Protected)* Retrieve authenticated profile and watchlist.

### Market Data & Charts
- `GET /api/coins?currency=usd` — Top 100 cryptocurrencies by market cap (cached for 60s).
- `GET /api/coins/:id/chart?days=7&currency=usd` — Historical market chart points (cached for 5m).
- `GET /api/coins/:id/ohlc?days=7&currency=usd` — Candlestick OHLC bars (cached for 5m).

### Sentiment & AI Insights
- `GET /api/sentiment/fear-greed` — Alternative.me Fear & Greed index score & historical trend.
- `GET /api/ai/market-summary` — Groq-generated macro crypto market overview.
- `GET /api/ai/coin/:id` — Groq-generated coin-specific trend observations.

### Price Alerts *(Protected)*
- `GET /api/alerts` — List authenticated user's active price alerts.
- `POST /api/alerts` — Create a one-shot price alert (`coinId`, `targetPrice`, `direction`).
- `DELETE /api/alerts/:id` — Delete / dismiss an active alert.

### Watchlist *(Protected)*
- `POST /api/watchlist/:coinId` — Add coin to user's saved watchlist.
- `DELETE /api/watchlist/:coinId` — Remove coin from user's saved watchlist.

---

## Architecture & Security Principles

1. **Proxy Isolation**: The client never connects directly to external APIs (CoinGecko, Alternative.me, Groq). All calls pass through `server/src/services/` so API keys and secrets never reach the browser.
2. **Multi-Tiered Cache Fallback**: To prevent API rate limits and handle third-party network outages, all market data and sentiments are cached in-memory (`node-cache`) with stale-while-revalidate fallbacks.
3. **Stateless JWT Security**: Passwords are encrypted with `bcryptjs`. Endpoints verifying user identity validate signatures via standard JWT Bearer tokens.
4. **Resilient Indicator Computations**: Technical indicators (SMA 20, SMA 50, RSI 14) and gainers/losers/recommendation metrics are computed client-side from existing payloads, preventing unnecessary backend load.

---

## Disclaimer

**Educational only — not financial advice.**
CryptoPulse is an analytics dashboard and educational tool. It does not provide financial advice, order execution, custody, or brokerage services. Cryptocurrency trading involves substantial risk of loss. Always conduct your own research before making investment decisions.

---

## License

This project is licensed under the [MIT License](LICENSE).
