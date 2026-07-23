# Revel.Baby

Shareable baby page for expecting parents. Each baby has a public page (`/b/<slug>`) with up to three optional features:

- **Gift registry** — parents add products (scraped from a URL via OpenAI + Bright Data); visitors reserve / buy / donate / pay.
- **Pregnancy tracker** — week-by-week info, optionally public.
- **Birth-date betting** — friends bet on the birth date; owners approve; email notifications via Resend.

Bilingual (English / Spanish), defaults tuned for Spain/EU (Bizum, EUR, `ES`).

## Tech stack

- **Next.js 15** (Pages Router) + **React 19**, JavaScript
- **Tailwind CSS 3**
- **Prisma 6** + **PostgreSQL**
- **Firebase Auth** (client) + **firebase-admin** (server-side ID-token verification)
- **Resend** (email), **OpenAI** + **Bright Data** + **Cheerio** (product scraping)

## Architecture notes

- **Auth:** users sign in with Firebase on the client. Every authenticated API call goes through `lib/apiClient.js#apiFetch`, which attaches the user's Firebase **ID token** as `Authorization: Bearer …`. The server verifies it with `lib/apiAuth.js` (`requireAuth` / `requireOwner`) — the client never sends `userId`/`email` in the body. Public routes (`/api/public/*`, gift reservation, placing a bet) are intentionally unauthenticated.
- **SSRF guard:** the scraper (`lib/scraping.js#assertPublicHttpUrl`) rejects non-http(s) schemes and hosts resolving to private/loopback/link-local IPs. `/api/articles/scrape` also requires auth and is rate-limited per user.

## Environment variables

Create a `.env` file (git-ignored). Required:

```
DATABASE_URL=postgresql://user:pass@host:5432/db

# Firebase client (NEXT_PUBLIC_* are exposed to the browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Admin — service-account JSON (single line) OR set GOOGLE_APPLICATION_CREDENTIALS to a key file
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}

# Integrations
RESEND_API_KEY=...
OPENAI_API_KEY=...
BRIGHTDATA_API_KEY=...      # optional; falls back to basic Cheerio scraping
FROM_EMAIL=Revel Baby <noreply@revel.baby>   # optional
```

> `FIREBASE_SERVICE_ACCOUNT` is required for the API to verify tokens. Without it, authenticated routes return 401. Get it from the Firebase console → Project settings → Service accounts → Generate new private key.

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # or `migrate dev` against a local DB
npm run dev                 # http://localhost:3000
```

## Docker

```bash
docker compose up --build          # starts postgres + app
docker compose --profile migrate up migrate   # run migrations
```

Set the env vars above in your shell / `.env` before building (the `NEXT_PUBLIC_*` vars are baked in at build time). `POSTGRES_PASSWORD` must be provided in production — do not rely on the compose default.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
