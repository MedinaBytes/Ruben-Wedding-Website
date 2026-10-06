# Ruben & Andrea — Luxury Wedding Invitation & Guest Management Platform

> **Date:** October 2, 2027  
> **Location:** Vienna, Austria  
> - **Ceremony (15:00, Arrival 14:30):** Catholic Church of Altmannsdorf (*Pfarrkirche St. Oswald*), Khleslplatz 10, 1120 Wien  
> - **Reception & Agape (From 17:00):** Hetzendorf Palace (*Schloss Hetzendorf*), Hetzendorfer Straße 79, 1120 Wien  
> **Languages Supported:** English (`en`), Español (`es`), Austrian German (`de-AT` · Badge **AT**), Magyar (`hu`)

---

## 1. Project Overview

This repository contains the bespoke digital wedding invitation, guest experience, and administration platform created for the wedding of Ruben David Quijada Sanchez & Andrea Müllauer.

The application blends digital craftsmanship with traditional stationery aesthetics:
- **3D Interactive Envelope Experience:** A handcrafted virtual envelope with custom wax seal break, 3D flap opening, letter emergence, and smooth transitions into the full wedding website.
- **Procedural Web Audio Synthesizer:** Zero external audio files or licensing issues; paper rustles, wax seal cracking, and reveal chimes are synthesized in real-time via the browser's Web Audio API.
- **Strict Multi-Tenant Guest Privacy:** Neutral public landing gate (`/`) with zero photo exposure. Guests access details and RSVP solely via cryptographically hashed private invitation tokens (or enumeration-resistant phone/email lookup).
- **Live Real-Time Spotify Integration:** Public catalog search powered by Spotify Web API client credentials (market `AT`) with live album artwork, artist resolution, and graceful fallback to manual song suggestions.
- **Authentic Multi-Language Localization:** Synchronized translations across 4 locales (`en`, `es`, `de-AT`, `hu`) with tailored Austrian German phrasing (*Agape*, *Bim*, *Öffis*, *Feststiege*) and royal Viennese palace dress code humor.
- **Full Administration Portal:** Guest invitation link generator, 1-click demo guest creation, automated QR code generation (SVG & PNG), bulk CSV import, live RSVP tracking with catering caps, table seating planner for Schloss Hetzendorf, song request moderation, site settings, and WhatsApp outreach manager.
- **Resilient Free-Tier Architecture:** Built strictly within the bounds of Vercel Hobby + Supabase Free + Resend Free tiers. Features an automated keep-alive cron job to prevent Supabase 7-day hibernation pauses, an email outbox queue enforcing a 100/day Resend limit with live quota metering, a 1-click JSON snapshot and CSV backup center (`/admin/export`), and an offline local JSON fallback with automatic secret sanitization.

---

## 2. System Architecture & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core Framework** | **Next.js 16.3** (App Router, Turbopack, React 19) | Server components, route handlers, high-performance static/dynamic rendering |
| **Language** | **TypeScript 6.0** (Strict Mode) | Complete end-to-end type safety |
| **Styling** | **Vanilla CSS Tokens & Responsive Utilities** | Fluid typography, responsive layouts, mobile-optimized admin tables, glassmorphism |
| **Animations** | **Motion 14 (Framer Motion)** | Spring physics, 3D envelope flap rotations, full `prefers-reduced-motion` compliance |
| **Sound Synthesis** | **Web Audio API** | Real-time procedural audio synthesis without external media files |
| **Internationalization** | **`next-intl` 4.14** | 4 synchronized locales with identical message structures (`en`, `es`, `de-AT`, `hu`) |
| **Database & Auth** | **Supabase (PostgreSQL 15+)** | Row Level Security (RLS), stored procedures, Supabase Auth with admin email allowlist |
| **Keep-Alive Cron** | **Vercel Cron (`/api/cron/keepalive`)** | Daily automated database query to prevent Supabase Free 7-day hibernation pause |
| **Email Infrastructure** | **Resend Free API** | Transactional RSVP confirmations and campaign outbox with 100/day hard cap drain & admin budget meter |
| **WhatsApp Outreach** | **Official `wa.me` Click-to-Chat** | Zero-ban, ToS-safe deep links with multi-language personalized pre-fills (replaces unstable background daemons) |
| **Music Integration** | **Spotify Web API (Market AT)** | Real-time track search, in-memory caching, playlist embed, and song suggestion reservations |
| **Image Processing** | **Sharp & Jimp** | Build-time and runtime image optimization for hero portraits and photo galleries |
| **Testing** | **Vitest 5 & Playwright** | Fast unit and integration testing suite (56 passing automated tests) |

---

## 3. Free-Tier Operational Guardrails

This project runs 100% on free tiers. The architecture strictly enforces their limits:

1. **Resend Free (100 emails/day cap):**
   - The platform uses a database-backed **Email Outbox** (`lib/email/outbox.ts`).
   - Bulk campaigns (Save-the-Date, RSVP reminders) are queued and drained at a safe rate of ~90 emails/day, reserving at least 10 slots daily for immediate transactional RSVP confirmations.
   - An interactive quota gauge is visible in `/admin/settings` showing daily emails dispatched vs. capacity.
2. **Supabase Free (500 MB DB, auto-pause after 7 days inactivity):**
   - A daily automated keep-alive endpoint (`/api/cron/keepalive`) is scheduled in `vercel.json` to perform active read/write pings, preventing project auto-pause.
   - No high-resolution guest photos are stored inside PostgreSQL; all assets are served through Next.js static asset pipelines.
   - Dedicated **Backup Center** at `/admin/export` provides 1-click full JSON database snapshots and CSV exports for offline archival.
3. **Vercel Hobby (Serverless execution limits):**
   - No long-lived socket daemons (such as Baileys). WhatsApp communication uses standard, ToS-compliant `wa.me` deep links.
   - Route handlers and server actions are designed for fast stateless execution (< 10 seconds).
4. **Local Fallback Storage Sanitization:**
   - In offline development or when Supabase credentials are not provided, the application safely falls back to `.local-db.json`.
   - The storage layer (`lib/storage/resilient-store.ts`) automatically strips sensitive credentials (`resendApiKey`, `smtpPass`, tokens) before writing to disk, ensuring secrets are never committed to version control.

---

## 4. Environment Variables Reference

Create a `.env.local` file in the root directory. Below is the complete specification:

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Fully qualified URL of the deployment | `http://localhost:3000` or `https://ruben-andrea.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous / public key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role secret (admin operations) | `eyJhbGciOi...` |
| `ADMIN_EMAIL_ALLOWLIST` | **Yes** | Comma-separated list of authorized admin emails | `admin@example.com,organizer@example.com` |
| `RESEND_API_KEY` | Optional | Resend API key for invitation and RSVP emails | `re_123456789...` |
| `RESEND_FROM_EMAIL` | Optional | Verified sender address on your custom domain | `invitacion@ruben-andrea.com` |
| `CRON_SECRET` | Optional | Shared bearer secret for Vercel Cron verification | `your_random_cron_secret` |
| `SPOTIFY_CLIENT_ID` | Optional | Spotify Developer Application Client ID | `your_spotify_client_id` |
| `SPOTIFY_CLIENT_SECRET` | Optional | Spotify Developer Application Client Secret | `your_spotify_client_secret` |
| `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL` | Optional | Public URL of the wedding playlist | `https://open.spotify.com/playlist/...` |
| `SPOTIFY_PLAYLIST_ID` | Optional | 22-character Spotify playlist ID | `4zpgM8knTb7CzrjMUQOS3E` |

### Minimal `.env.local` Example
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_EMAIL_ALLOWLIST=admin@example.com
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=invitacion@ruben-andrea.com
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

---

## 5. Local Setup & Quick Start

### Prerequisites
1. **Node.js**: v20.x or v22.x LTS
2. **npm**: v10.x or higher
3. **Git**

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MedinaBytes/Ruben-Wedding-Website.git
   cd "Ruben Wedding Website"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Update variables as needed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs prebuild image optimization and starts Next.js dev server with Turbopack |
| `npm run build` | Optimizes images and produces optimized production build (`next build`) |
| `npm run start` | Starts production server on configured port |
| `npm run typecheck` | Validates TypeScript types across the entire project (`tsc --noEmit`) |
| `npm test` | Runs the Vitest test suite (56 automated tests) |
| `npm run test:e2e` | Runs Playwright browser integration tests |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run optimize:images` | Generates WebP/AVIF responsive images from originals in `public/photos/` |
| `npm run spotify:authorize` | CLI OAuth server to obtain a Spotify user refresh token for playlist writes |

---

## 7. Supabase Database Setup & Migrations

If configuring a new Supabase project:

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Go to **Project Settings** → **API** to copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` API key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` secret (`SUPABASE_SERVICE_ROLE_KEY`)
3. Open the **SQL Editor** in your Supabase dashboard and run:
   - [`supabase/schema_all.sql`](supabase/schema_all.sql) — Sets up tables (`invitations`, `rsvps`, `song_requests`, `site_settings`, `invitation_events`, `admin_audit_logs`), Row Level Security policies, indexes, and stored procedures (`reserve_spotify_song_request`).
   - [`supabase/migrations/20261003212512_secure_guest_lookup.sql`](supabase/migrations/20261003212512_secure_guest_lookup.sql) — Secure guest lookup hashing and multi-language constraint updates.
4. **Configure Authentication:**
   - Under **Authentication** → **Sign In / Providers**, enable **Email**.
   - Create an admin user with the email configured in your `ADMIN_EMAIL_ALLOWLIST`.
5. **Keep-Alive Cron:**
   - The project includes [`vercel.json`](vercel.json) configuring a daily trigger to `/api/cron/keepalive` so your Supabase database never enters dormant hibernation.

---

## 8. Spotify Web API Configuration

The music section provides live track searching and playlist contributions:

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Create an App (e.g., `Ruben Andrea Wedding`).
3. Set the Redirect URI in Spotify Dashboard settings to:
   ```
   http://127.0.0.1:8888/callback
   ```
4. Copy **Client ID** and **Client Secret** into your `.env.local`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
5. *(Optional — Playlist Write Permissions)* To allow guests' requested songs to be added directly to your Spotify playlist:
   ```bash
   npm run spotify:authorize
   ```
   Authorize in your browser; the generated `SPOTIFY_REFRESH_TOKEN` will automatically be saved.

---

## 9. Production Deployment Guide (Vercel)

1. Push your repository to GitHub / GitLab.
2. In [Vercel](https://vercel.com): Click **"Add New"** → **"Project"** and import the repository.
3. **Framework Preset:** `Next.js`
4. **Build Command:** `npm run build`
5. **Install Command:** `npm install`
6. In **Settings** → **Environment Variables**, provide:
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://ruben-andrea.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL_ALLOWLIST`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `CRON_SECRET`
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
7. Click **Deploy**. Vercel will build and deploy the production application.

---

## 10. Manual Testing & Feature Walkthrough

Use this checklist to test the application locally or in staging:

| Step | URL | Features to Verify |
|---|---|---|
| **1. Public Gate** | [`/`](http://localhost:3000/) | Neutral monogram card, no sensitive data exposed, language switcher (`EN`, `ES`, `AT`, `HU`), rate-limited enumeration-resistant guest lookup. |
| **2. Envelope Intro** | [`/i/demo`](http://localhost:3000/i/demo?lang=de-AT) | 3D envelope, audio toggle, wax seal click animation & sound, monogram reveal, card lift, "Continue directly" notice on re-visit. |
| **3. Wedding Invitation** | [`/i/demo/invitation`](http://localhost:3000/i/demo/invitation?lang=de-AT) | Hero countdown, couple portrait, schedule (St. Oswald & Schloss Hetzendorf), symmetrical 10-photo bento grid lightbox, interactive OpenStreetMap, transit info (ÖBB, S7, CAT, Bim), royal dress code note. |
| **4. Music Search** | Section `#music` | Live search for real artists, live album artwork from Spotify CDN, multi-track queue submission with server-side caching. |
| **5. RSVP Submission** | Section `#rsvp` | Attendance toggle, plus-one toggle, additional guest names, dietary requirements, catering dish caps, Austrian German notes to the couple (*"an das Brautpaar"*). |
| **6. Admin Portal** | [`/admin`](http://localhost:3000/admin) | Login via Supabase Auth, dashboard metrics, invitation creation, 1-click demo guest creation, SVG/PNG QR codes, CSV bulk import with column mapping, WhatsApp manager with ToS-safe deep links. |
| **7. Seating Planner** | [`/admin/seating`](http://localhost:3000/admin/seating) | Visual table arrangement for Schloss Hetzendorf, table capacity tracking, unassigned guest assignment, CSV export. |
| **8. Check-In Reception** | [`/admin/checkin`](http://localhost:3000/admin/checkin) | Live guest check-in with rapid search, instant 1-click arrival confirmation, table routing, and live venue aforo statistics. |
| **9. Backup Center** | [`/admin/export`](http://localhost:3000/admin/export) | 1-click full JSON snapshot download, separate CSV exports for guests, RSVPs, and seating chart. |

---

## 11. Quality Gates & Verification

Before submitting pull requests or releasing builds, run the automated verification suite:

```bash
# 1. Type check
npm run typecheck

# 2. Unit and integration tests (56 passing tests)
npm test

# 3. Linter
npm run lint

# 4. Production build validation
npm run build
```

---

## 12. Strategic Roadmap & Documentation

For the complete product evaluation against commercial market leaders (Joy, Zola, RSVPify), open-source architectural patterns (Tableaux, Wedding Manager, Hi.Events), and the 12-month campaign schedule leading up to October 2, 2027:

👉 **Read the full roadmap:** [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## 13. License & Attribution

- **Source Code:** Private and proprietary to Ruben & Andrea.
- **Botanical Illustrations:** Vector line art assets in `public/orchids/` are custom artworks created exclusively for this wedding platform under the MIT License.
- **Crafted with Love:** Developed by Jonathan Medina for Ruben & Andrea.
