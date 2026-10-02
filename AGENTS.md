# AGENTS.md — CryptoPulse (MVP)

Rules for any AI coding agent working in this repo — written for **Google Antigravity** (which reads this file from the repo root automatically) and kept in sync as `.github/copilot-instructions.md` for GitHub Copilot. If a `GEMINI.md` ever appears in this repo it would override this file for Antigravity only — don't create one.

Source of truth for *what* to build: `PRD.md`. Source of truth for *order/sequencing*: `PLAN.md`. Source of truth for *how it should look*: `DESIGN.md`. This file is *how to behave* while building it.

**This is the MVP build (v2.0) — 2-day scope.** If anything you read elsewhere (old chat history, cached context, your own assumptions) suggests Supabase, Fastify, TypeScript, a pnpm monorepo, Google OAuth, Binance WebSockets, or Groq — that's the **archived v1.1 plan**, not this build. Ignore it unless `PRD.md` §9 or `PLAN.md`'s stretch section explicitly says otherwise.

---

## 1. Project summary
CryptoPulse MVP: a dashboard for the top 100 cryptocurrencies with a line chart, top gainers/losers, and a simple rule-based Bullish/Neutral/Bearish read, behind a real signup/login wall. Built in ≤ 2 days. Not a trading product — no order execution, no custody, no real financial advice.

---

## 2. Scope discipline
- Do only the task you were given — cite its `PLAN.md` task number (e.g. "Task 5") before editing files.
- Don't build anything listed under "Non-goals" in `PRD.md` §5 unless the person explicitly asks for it in this session. If a prompt seems to ask for one of those (e.g. "add Google login," "add candlestick charts with RSI"), do it — the person's live instruction in the session overrides the written scope — but otherwise assume the cut stands.
- Don't refactor, rename, or reorganize files outside the current task's scope.
- Keep diffs small. If a task looks like it needs more than ~1–2 hours or more than ~5 files, say so before starting and suggest a split.

---

## 3. Stack (exact, don't substitute)
- **client/** — React (Vite), **plain JavaScript** (no TypeScript), Tailwind CSS, React Router, Recharts, Axios.
- **server/** — Node.js, **Express**, **plain JavaScript**, Mongoose (MongoDB Atlas), `bcryptjs`, `jsonwebtoken`, `node-cache`, `axios`, `cors`, `dotenv`.
- **Database** — MongoDB only. One collection for now: `User` (see `PLAN.md` Task 2). Don't introduce Postgres/Drizzle/Supabase.
- **No monorepo tooling.** Two plain folders (`client/`, `server/`), each with its own `package.json` and `node_modules`. Don't add pnpm workspaces, Turborepo, or Nx.
- **No TypeScript.** Don't add `.ts`/`.tsx` files, `tsconfig.json`, or type-checking scripts — it wasn't chosen for this build and adding it now creates config work nobody asked for.
- **Data source: CoinGecko only**, proxied through `server/` so the API key (if any) never reaches the browser. No Binance, no FX provider, no Groq/any LLM API.

---

## 4. Architecture rules
1. **The browser never calls CoinGecko directly.** Only `server/src/services/coingecko.js` talks to it; the client calls `GET /api/coins` and `GET /api/coins/:id/chart`.
2. **Every CoinGecko call goes through the cache** (`node-cache`, ~60s for the markets list, ~5min per coin+range for chart data). Don't add a bare `axios.get` to a CoinGecko URL anywhere else.
3. **JWT, not sessions, not Supabase.** `jsonwebtoken` signs/verifies using `JWT_SECRET` from `.env`. Passwords are hashed with `bcryptjs` — never store or log a plaintext password, ever, even in a test fixture or a console.log while debugging.
4. **Gainers/losers and the recommendation label are computed client-side** from the same `/api/coins` payload (see `PRD.md` §6 for the exact recommendation formula — implement it verbatim, don't invent your own scoring). Don't add new server endpoints for these; that defeats the point of the scope cut.
5. **Validate request bodies** on `/api/auth/signup` and `/api/auth/login` (password length, required fields) and return clear 400 messages — but don't build out a full Zod/Joi validation layer for a two-route auth system; plain `if` checks are fine here.
6. **No real-time push.** The client polls `/api/coins` on an interval (`PLAN.md` Task 5 specifies ~45s). Don't add WebSockets, Server-Sent Events, or a cron scheduler — not in scope for the MVP.

---

## 5. Testing — calibrated to a 2-day build
This project does **not** have an automated test suite requirement. Instead:
- After each task, run the quick checks listed in that `PLAN.md` task (usually a `curl` or two, or a manual click-through) and report the real result honestly.
- If you want to add a couple of fast smoke tests (e.g. one Supertest hit on `/api/auth/signup`), that's fine, but don't block a task on building test infrastructure that wasn't asked for.
- Never claim something works without having actually run it in this session.

---

## 6. Security rules (these still apply, even on a 2-day build)
1. Never print, log, or commit secrets — `JWT_SECRET`, `MONGODB_URI`, `COINGECKO_API_KEY` live only in `server/.env` (git-ignored).
2. Never log a password or a full JWT, even temporarily for debugging.
3. Hash passwords with `bcryptjs` before storing — never store plaintext, never roll your own hashing.
4. Every protected route (`/api/auth/me`, and anything in the watchlist stretch task) must go through the JWT middleware — don't trust a client-supplied user id in the request body.
5. A failed login or signup returns a generic error ("invalid credentials" / "already exists") — don't leak whether an email vs. username was the problem.

---

## 7. UI rules (see `DESIGN.md` for the full system)
1. Never convey price direction or recommendation state by color alone — pair with the ▲/▼ glyph or label text (already specified in `DESIGN.md` §4's `PriceChange` component — reuse it everywhere a % appears).
2. The "Educational only — not financial advice" disclaimer must appear wherever the recommendation badge appears, always visible, never hidden behind a hover or a collapsed section.
3. One font (Inter), one dark theme, Tailwind's default spacing/radius scale — don't introduce a second typeface, a light theme, or a custom design-token system for this build; that's explicitly deferred (`DESIGN.md` §7).
4. Reuse shared components (`PriceChange`, `Pill`, `Sparkline`, `CoinIcon`, `Skeleton`) rather than writing a one-off version per page.

---

## 8. Dependencies
Everything needed for the full 2-day build is listed in `PLAN.md` §0.3 and should be installed once, up front. **Don't add a new dependency without asking first** — name the package, why the existing stack can't do it, and wait for approval. This matters more, not less, on a tight timeline: a mid-task `npm install` of the wrong thing is the single most common way these builds stall.

---

## 9. Working style
1. For any multi-file task, start with a one-paragraph plan (files touched, anything you're unsure about) before writing code.
2. If an error repeats after one fix attempt, stop, explain your root-cause hypothesis in plain terms, and ask before trying a third approach — don't thrash, there isn't time for it.
3. Prefer the smallest change that satisfies the task's "Done when" line in `PLAN.md`. This build rewards finishing the five stated goals over polishing any one of them.
4. If you're unsure whether something is in scope, check `PRD.md` §4 (goals) and §5 (non-goals) before guessing.

---

## 10. Quick reference — do not
- Don't add TypeScript, a monorepo tool, Supabase, Postgres, Fastify, Binance, Groq, or Google/OAuth login.
- Don't call CoinGecko from the browser.
- Don't add a server endpoint for gainers/losers/recommendation — compute client-side from `/api/coins`.
- Don't store or log plaintext passwords or full JWTs.
- Don't skip the disclaimer next to a recommendation badge.
- Don't add a new npm dependency without asking.
- Don't build automated test infrastructure that wasn't requested — quick manual/curl checks are enough here.
- Don't start the stretch tasks (watchlist, deploy) before the Day 2 core checkpoint in `PLAN.md` is working.
