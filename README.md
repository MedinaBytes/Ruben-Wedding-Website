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
- **Strict Multi-Tenant Guest Privacy:** Neutral public landing gate (`/`) with zero photo exposure. Guests access details and RSVP solely via cryptographically hashed private invitation tokens (or phone/email lookup).
- **Live Real-Time Spotify Integration:** Public catalog search powered by Spotify Web API client credentials (market `AT`) with live album artwork and artist resolution.
- **Authentic Multi-Language Localization:** Synchronized translations across 4 locales (`en`, `es`, `de-AT`, `hu`) with tailored Austrian German phrasing (*Agape*, *Bim*, *Öffis*, *Feststiege*) and royal Viennese palace dress code humor.
- **Full Administration Portal:** Guest invitation link generator, 1-click demo guest creation, automated QR code generation (SVG & PNG), bulk CSV import, live RSVP tracking, song request moderation, site settings, and WhatsApp integration.
- **Resilient Fallback Storage:** Automatic failover to local JSON database (`.local-db.json`) if Supabase is offline or during offline local development.

---

## 2. System Architecture & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core Framework** | **Next.js 16.3** (App Router, Turbopack, React 19) | Server components, route handlers, high-performance static/dynamic rendering |
| **Language** | **TypeScript 6.0** (Strict Mode) | Complete end-to-end type safety |
| **Styling** | **Vanilla CSS Tokens & Utility Layouts** | Fluid typography, responsive layouts, glassmorphism, bespoke color palette |
| **Animations** | **Motion 14 (Framer Motion)** | Spring physics, 3D envelope flap rotations, full `prefers-reduced-motion` compliance |
| **Sound Synthesis** | **Web Audio API** | Real-time procedural audio synthesis without external media files |
| **Internationalization** | **`next-intl` 4.14** | 4 synchronized locales with identical message structures (`en`, `es`, `de-AT`, `hu`) |
| **Database & Auth** | **Supabase (PostgreSQL 15+)** | Row Level Security (RLS), stored procedures, Supabase Auth with admin email allowlist |
| **Music Integration** | **Spotify Web API & Apple Music Catalog** | Real-time track search, playlist embed, and song suggestion reservations |
| **Messaging** | **`@whiskeysockets/baileys` & `nodemailer`** | WhatsApp web session pairing with anti-ban rate limiting, SMTP email dispatch |
| **Image Processing** | **Sharp & Jimp** | Build-time and runtime image optimization for hero portraits and photo galleries |
| **Testing** | **Vitest 5 & Playwright** | Fast unit and integration testing suite (30 automated tests) |

---

## 3. Dependencies & Key Libraries

### Production Dependencies (`dependencies`)
```json
{
  "@fontsource-variable/bodoni-moda": "^5.3.0",  // Luxury editorial serif typography
  "@fontsource-variable/manrope": "^5.3.0",      // Clean, modern body sans-serif
  "@fontsource/italianno": "^5.3.0",             // Calligraphic script accents
  "@hookform/resolvers": "^5.9.1",               // Form validation bridges
  "@supabase/ssr": "^0.12.7",                    // Server-side Supabase authentication & cookies
  "@supabase/supabase-js": "^2.117.2",           // PostgreSQL client & Realtime
  "@whiskeysockets/baileys": "^6.7.24",          // WhatsApp Web multi-device socket client
  "jimp": "^1.6.1",                              // Image manipulation fallback
  "leaflet": "^1.9.4",                           // Interactive venue maps
  "libphonenumber-js": "^1.13.14",               // International phone normalization
  "motion": "^14.0.0",                           // Advanced animation & gesture engine
  "next": "^16.3.8",                             // Next.js framework
  "next-intl": "^4.14.9",                        // Type-safe internationalization
  "nodemailer": "^10.0.14",                      // SMTP email dispatch
  "pino": "^10.4.0",                             // Structured logging for WhatsApp service
  "qrcode": "^1.5.4",                            // Vector (SVG) and raster (PNG) QR codes
  "react": "^19.3.0",                            // React 19 core
  "react-dom": "^19.3.0",                        // React 19 DOM bindings
  "react-hook-form": "^7.89.0",                  // Performant client-side forms
  "server-only": "^0.0.1",                       // Boundary isolation for secure server code
  "sharp": "^0.35.5",                            // High-performance image transform pipeline
  "zod": "^4.6.5"                                // Schema validation for requests & forms
}
```

### Development Dependencies (`devDependencies`)
- `typescript`: Type checking (`npm run typecheck`)
- `vitest`: Unit and integration test runner (`npm test`)
- `eslint` & `eslint-config-next`: Code quality and linting
- `tsx`: TypeScript script executor for image optimization and Spotify OAuth
- `@playwright/test`: End-to-end browser automation

---

## 4. Environment Variables Reference

Create a `.env.local` file in the root directory. Below is the complete specification:

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Fully qualified URL of the deployment | `http://localhost:3000` or `https://ruben-andrea.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous / public key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role secret (admin operations) | `eyJhbGciOi...` |
| `ADMIN_EMAIL_ALLOWLIST` | **Yes** | Comma-separated list of authorized admin emails | `jonathan25082@gmail.com,ruben@example.com` |
| `ADMIN_EMAIL` | Optional | Primary admin email address | `jonathan25082@gmail.com` |
| `SPOTIFY_CLIENT_ID` | **Yes** | Spotify Developer Application Client ID | `af6c8eb6aba24...` |
| `SPOTIFY_CLIENT_SECRET` | **Yes** | Spotify Developer Application Client Secret | `d7b4df58a50...` |
| `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL` | Optional | Public URL of the wedding playlist | `https://open.spotify.com/playlist/4zpgM8...` |
| `SPOTIFY_PLAYLIST_ID` | Optional | 22-character Spotify playlist ID | `4zpgM8knTb7CzrjMUQOS3E` |
| `SPOTIFY_REFRESH_TOKEN` | Optional | Spotify OAuth refresh token for playlist modification | `AQB...` |
| `SPOTIFY_REDIRECT_URI` | Optional | Local OAuth redirect URI (for `npm run spotify:authorize`) | `http://127.0.0.1:8888/callback` |

### Minimal `.env.local` Example
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_EMAIL_ALLOWLIST=admin@example.com
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL=https://open.spotify.com/playlist/4zpgM8knTb7CzrjMUQOS3E
SPOTIFY_PLAYLIST_ID=4zpgM8knTb7CzrjMUQOS3E
```

---

## 5. Local Setup & Quick Start

### Prerequisites
1. **Node.js**: v20.x or v22.x LTS (compatible with Node 20+)
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
   cp .env .env.local
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
| `npm test` | Runs the Vitest test suite (unit and integration tests) |
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

## 9. Production Deployment Guide

### Option A: Deploying to Vercel (Recommended)

1. Push your code to GitHub / GitLab.
2. In [Vercel](https://vercel.com): Click **"Add New"** → **"Project"** and select the repository.
3. **Framework Preset:** `Next.js`
4. **Build Command:** `npm run build`
5. **Install Command:** `npm install`
6. In **Settings** → **Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://ruben-andrea.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL_ALLOWLIST`
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_PLAYLIST_ID`
   - `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL`
   - `SPOTIFY_REFRESH_TOKEN` (if authorized)
7. Click **Deploy**. Vercel will build and launch the site.

### Option B: Self-Hosted Docker or Node.js Server

1. **Build the production application:**
   ```bash
   npm ci
   npm run build
   ```
2. **Start the production server:**
   ```bash
   NODE_ENV=production PORT=3000 npm run start
   ```
3. Set up a reverse proxy (Nginx, Caddy, or Cloudflare Tunnel) pointing to `localhost:3000` with SSL/TLS termination.

---

## 10. Manual Testing & Feature Walkthrough

Use this checklist to test the application locally or in staging:

| Step | URL | Features to Verify |
|---|---|---|
| **1. Public Gate** | [`/`](http://localhost:3000/) | Neutral monogram card, no sensitive data exposed, language switcher (`EN`, `ES`, `AT`, `HU`), guest invitation lookup by name/email/phone. |
| **2. Envelope Intro** | [`/i/demo`](http://localhost:3000/i/demo?lang=de-AT) | 3D envelope, audio toggle, wax seal click animation & sound, monogram reveal, card lift, "Continue directly" notice on re-visit. |
| **3. Wedding Invitation** | [`/i/demo/invitation`](http://localhost:3000/i/demo/invitation?lang=de-AT) | Hero countdown, couple portrait, schedule (St. Oswald & Schloss Hetzendorf), symmetrical 10-photo bento grid lightbox, interactive OpenStreetMap, transit info (ÖBB, S7, CAT, Bim), royal dress code note. |
| **4. Music Search** | Section `#music` | Live search for real artists (e.g. "Mozart", "Shakira"), live album artwork from Spotify CDN, multi-track queue submission. |
| **5. RSVP Submission** | Section `#rsvp` | Attendance toggle, plus-one toggle, additional guest names, dietary requirements, warm Austrian German notes to the couple (*"an das Brautpaar"*). |
| **6. Admin Portal** | [`/admin`](http://localhost:3000/admin) | Login via Supabase Auth, dashboard metrics, invitation creation, 1-click demo guest creation, SVG/PNG QR codes, CSV export/import, WhatsApp manager. |

---

## 11. Quality Gates & Verification

Before submitting pull requests or releasing builds, run the automated verification suite:

```bash
# 1. Type check
npm run typecheck

# 2. Unit and integration tests (30 passing tests)
npm test

# 3. Linter
npm run lint

# 4. Production build validation
npm run build
```

---

## 12. License & Attribution

- **Source Code:** Private and proprietary to Ruben & Andrea.
- **Botanical Illustrations:** Vector line art assets in `public/orchids/` are custom artworks created exclusively for this wedding platform under the MIT License.
- **Crafted with Love:** Developed by Jonathan Medina for Ruben & Andrea.
