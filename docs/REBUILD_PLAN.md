# Rebuild Plan & Technical Architecture Audit
## Ruben & Andrea Wedding Website (Vienna, 02.10.2027)

---

## 1. Executive Summary & Audit of Current Repository

The repository has been audited against the Master Prompt, `wedding_invitation_website_spec.md`, the design system rules, and engineering requirements. While solid technical foundations exist in the database schemas (`supabase/migrations/`) and optimized photo generation (`scripts/optimize-images.ts`), the guest experience, botanical presentation, animation choreography, audio architecture, and admin toolset fall short of the luxury invitation benchmark:

1. **Routing Architecture**: The site currently mounts the intro dialog directly on top of the entire invitation on `/i/[token]`, and has a guest lookup search form on `/`. This contradicts the required site architecture: `/` must be a neutral private landing, `/i/[token]` must be an unencumbered envelope experience with zero couple photos, and `/i/[token]/invitation` must host the editorial invitation website.
2. **Envelope Intro Experience**: `components/invitation/invitation-intro.tsx` is merely an unstyled HTML `<dialog>` with a two-note sine tone. There is no 3D envelope, no wax seal monogram, no paper textures, no card extraction motion, and no progressive line-drawing.
3. **Botanical Artwork**: `public/images/botanicals/music-orchid.svg` is an off-the-shelf single vector. There are no bespoke Phalaenopsis orchid stems, single blooms, linework vectors for stroke-dasharray animation, corner frames, or letterpress patterns.
4. **Sound Architecture**: Currently sound is an inline Web Audio oscillator embedded inside the intro component. Missing a unified `lib/sound` system with `SoundProvider`, persistent user preference, and organic auditory textures (wax crack, paper slide, card reveal, button ticks, bloom chimes).
5. **Admin Capabilities**: Current `/admin` is a single client component with rudimentary table rendering. Missing dedicated sub-routes (`/admin/invitations`, `/admin/rsvps`, `/admin/music`, `/admin/analytics`, `/admin/settings`, `/admin/login`), CSV bulk import with templating, QR code generation and download, deep search/filter, and proper statistical denominators.
6. **Lookup Form**: The phone/email lookup on `/` creates unnecessary surface area and currently fails unit tests (`app/actions/lookup-invitation.test.ts`). The prompt mandates private, opaque 256-bit token URLs distributed directly to guests.

---

## 2. Team Role Reviews & Decisions

### 2.1 Creative Director
- **Review**: The palette tokens (strawberry OKLCH, matcha OKLCH, rose-gold accents, warm paper neutrals) and fonts (`Bodoni Moda`, `Italianno`, `Manrope`) are well chosen, but the current UI feels like a collection of bordered cards rather than an editorial luxury stationery suite.
- **Decisions**:
  - Enforce "Contemporary Botanical Minimalist" art direction: generous negative space, airy proportions, asymmetrical botanical draping, fine metallic hairlines (`rgba(180, 130, 90, 0.25)`), and blind-embossed paper tactility.
  - Eliminate repetitive card boxes. Give each section an editorial layout inspired by high-end printed editorial monographs.
  - Intro page must look and feel like physical handmade cotton rag paper with deckled edges and an authentic vermilion-rose wax seal.

### 2.2 Botanical Illustrator
- **Review**: The single `music-orchid.svg` in `public/images/botanicals/` is rudimentary and unacceptable.
- **Decisions**:
  - Create 6 authentic, handcrafted SVG botanical assets in `public/orchids/`:
    1. `orchid-stem-cascade.svg`: Cascading Phalaenopsis stem with graceful curving branches, buds, half-open and open blooms with watercolor layered gradients.
    2. `orchid-single-bloom.svg`: High-detail focal orchid showing dorsal petal, lateral sepals, labellum/lip, and column.
    3. `orchid-linework.svg`: Continuous fine-line vector with calibrated path lengths for `pathLength` / `stroke-dasharray` scroll animation.
    4. `orchid-corner.svg`: Organic corner framing piece that cradles layout sections without enclosing them in rigid borders.
    5. `orchid-pattern.svg`: Repeatable tone-on-tone botanical motif for blind-emboss / letterpress texture on paper surfaces.
    6. `seal-monogram.svg`: Elegant monogram wax seal with R&A ligature and organic edge rim.
  - Implement `/dev/botanical` dev route to showcase and inspect all assets across light, paper, and dark modes at various scales.

### 2.3 Motion Designer
- **Review**: Animations are currently limited to basic opacity and translate fades. The intro has zero physics or spatial dimension.
- **Decisions**:
  - Author a unified motion token suite in `lib/motion/tokens.ts` (durations, custom Béziers `[0.2, 0.7, 0.2, 1]`, spring stiffness/damping, stagger intervals).
  - Intro envelope sequence (6–9s total, interruptible via Skip button):
    1. Centered envelope resting on subtle drop-shadow with wax seal.
    2. User tap on seal triggers wax crack/lift animation and audio.
    3. Envelope top flap rotates open in 3D perspective (`transformOrigin: "top center"`, `rotateX: -180deg`).
    4. Letterpress card slides upward out of the envelope pocket.
    5. Orchid linework traces itself along the card perimeter via `pathLength: [0, 1]`.
    6. Card settles and transitions into `/i/[token]/invitation` with a shared layout scale/fade.
  - Main page scroll animations: masked image reveal (clip-path settle), timeline line self-drawing on scroll enter, and botanical scroll drift.
  - Full support for `prefers-reduced-motion` across all components (immediate fades, static envelope click-through).

### 2.4 Sound Designer
- **Review**: The existing two-tone sine oscillator lacks character and tactile realism.
- **Decisions**:
  - Build `lib/sound/` with `SoundProvider`, `useSound()`, and Web Audio synthesizers with zero external license encumbrance.
  - Implement bespoke acoustic synthesis:
    - `seal-tap`: Low-end resonant pop with high-frequency tactile friction (wax break).
    - `envelope-open`: Filtered white-noise envelope mimicking crisp paper sliding.
    - `card-reveal`: Harmonic chime with soft metallic sheen and gentle decay.
    - `button-click`: Muted tick for interactive controls.
    - `rsvp-success`: Warm major-chord bloom with shimmer resonance.
    - `toggle`: Subtle soft click for sound/locale controls.
  - Strictly no autoplay prior to user interaction. Global toggle with `localStorage` persistence and `aria-pressed`.

### 2.5 Lead Frontend Engineer
- **Review**: Next.js App Router (16.3 with React 19) is in place, but route separation is missing.
- **Decisions**:
  - Structure routes:
    - `app/page.tsx`: Neutral private landing explaining personal invitation link required.
    - `app/i/[token]/page.tsx`: Intro envelope animation page.
    - `app/i/[token]/invitation/page.tsx`: Main editorial invitation page.
    - `app/privacy/page.tsx`: Privacy notice.
    - `app/admin/`: Modular admin portal (`/admin/login`, `/admin/invitations`, `/admin/rsvps`, `/admin/music`, `/admin/analytics`, `/admin/settings`).
    - `app/dev/botanical/page.tsx`: Botanical asset gallery for development review.
  - Migrate away from the failing `lookup-invitation` flow, focusing strictly on validated token parameters.
  - Optimize client hydration and bundle sizes: lazy load Leaflet map and Spotify embed on intersection.

### 2.6 Backend / Data Engineer
- **Review**: Supabase migrations provide a strong relational core (`invitations`, `rsvps`, `song_requests`, `invitation_events`, `site_settings`, rate limits).
- **Decisions**:
  - Retain 256-bit token generation (`crypto.randomBytes(32).toString('base64url')`) and SHA-256 hashing.
  - Verify server-side Zod validation on all actions (RSVP submissions, song requests, event logging).
  - Ensure link-preview scrapers (WhatsApp, iMessage, Facebook) do not trigger `INVITE_OPENED` analytics events; record `INVITE_OPENED` strictly via client-side beacon after actual user mount.
  - Provide database seed scripts and CSV import parser for the 52+ guest list.

### 2.7 Admin Product Engineer
- **Review**: Current `/admin` has basic table display but lacks dedicated routes, QR code export, CSV import, full invitation editing, settings control, and danger zone operations.
- **Decisions**:
  - Build a comprehensive, responsive admin dashboard using Supabase Auth:
    - `/admin`: Overview metrics (invitation count, opened count with clear denominator, attendance rate, RSVP status cards, music request summary).
    - `/admin/invitations`: Table with search, group filter, status badge, create invitation modal, edit/revoke actions, token copy, and downloadable SVG/PNG QR code.
    - `/admin/invitations/import`: CSV guest list importer supporting column mapping and validation.
    - `/admin/rsvps`: Attendee list, filterable by Yes/No/Pending, dietary summary, notes, CSV export.
    - `/admin/music`: Song requests grouped by frequency, Spotify search links, selection toggle, CSV export.
    - `/admin/analytics`: Timeline of engagement events per invitation, open rates vs client visits.
    - `/admin/settings`: Toggles for `showGiftDetails`, `showPrivateAddress`, contact information, Spotify playlist URL.
    - `/admin/danger`: Wedding data purge with typed confirmation ("DELETE WEDDING DATA").

### 2.8 Localization Editor
- **Review**: Translations exist in `locales/{en,es,de,hu}/common.json`, but terminology and emotional tone must be verified.
- **Decisions**:
  - Keep 4 locales: `en` (English), `es` (Spanish), `de` (German / Austrian German context), `hu` (Hungarian).
  - Standardize locale codes to `["en", "es", "de", "hu"]` across config, database constraints, cookies, and UI.
  - Preserve the couple's genuine conversational phrases ("Please arrive 30 minutes earlier. PLEASE.", "until the body can stand it", toaster gift humor).
  - Verify key alignment across all 4 locales via automated test.

### 2.9 Accessibility & Performance Auditor
- **Review**: Contrast is mostly compliant, but dynamic interactive elements need ARIA semantics.
- **Decisions**:
  - Ensure all interactive elements have unique IDs and ARIA labels.
  - Implement `skip-link` pointing to `#main`.
  - Respect `prefers-reduced-motion` at every level (media query and CSS variables).
  - Target Lighthouse mobile scores: Performance ≥ 90, Accessibility ≥ 95.

### 2.10 QA Lead
- **Review**: Existing test suite had a failing test in `lookup-invitation.test.ts`.
- **Decisions**:
  - Retire the deprecated lookup test and replace it with end-to-end token validation tests, RSVP submission tests, rate limit tests, and admin authorization tests.
  - Add Playwright E2E testing covering:
    1. Valid token entry at `/i/[token]`.
    2. Intro animation play and skip.
    3. Seamless transition to `/i/[token]/invitation`.
    4. RSVP submission (Yes/No, guest counts, dietary notes).
    5. Song request submissions (up to 3 songs, 4th rejected).
    6. Admin login, invitation management, and CSV export.

---

## 3. Specification Gap Analysis Table

| Requirement | Spec Section | Status | Action |
|---|---|---|---|
| Neutral Landing Page | §3 | Partial | Replace lookup form on `/` with private neutral invitation gate explaining that guests must use their personal link. |
| Dedicated Intro Page `/i/[token]` | §3, §4 | Missing | Create `app/i/[token]/page.tsx` rendering the standalone 3D envelope experience without couple photography. |
| Main Invitation Page `/i/[token]/invitation` | §3, §7 | Missing | Move full wedding invitation content to dedicated route `app/i/[token]/invitation/page.tsx`. |
| 3D Envelope Opening & Wax Seal | §4 | Missing | Implement 3D folding envelope with perspective, monogram seal crack/lift, card slide, and Skip button. |
| High-End Botanical SVG Artwork | §5 | Missing | Hand-craft 6 authentic Phalaenopsis orchid SVGs (stem, bloom, linework, corner, pattern, seal). |
| Botanical Dev Showcase `/dev/botanical` | §5 | Missing | Create interactive preview page displaying all botanical vectors across multiple scales and backgrounds. |
| Synthesized Sound System | §6 | Weak | Build `lib/sound` with `SoundProvider`, `useSound()`, Web Audio synthesis (seal, paper slide, shimmer, tick, bloom), and persistent mute toggle. |
| Header with Nav & Controls | §7.1 | Partial | Refine `SiteHeader` with language dropdown (EN/ES/DE/HU), sound mute toggle, and smooth anchor links. |
| Hero Section | §7.2 | OK | Enhance hero typography, personalized greeting, and editorial photo reveal motion. |
| Countdown Timer | §7.3 | OK | Target `2027-10-02T15:00:00` in `Europe/Vienna`; switch to celebratory state on wedding day. |
| Our Day / Timeline | §7.4 | Partial | Add self-drawing SVG timeline track with emphasized 14:30 arrival and "~17:00 Until the body can stand it". |
| Ceremony & Reception Location Cards | §7.5, §7.6 | OK | Refine styling, address copy, and direct Google Maps / Apple Maps / Directions triggers. |
| Interactive Leaflet Map | §7.5, §7.6 | OK | Lazy load Leaflet on intersection with custom matcha/strawberry map pins. |
| Travel / How to Get There | §7.7 | OK | Verify airport, train, and regional transit links per locale. |
| Where to Stay (Privacy-Safe) | §7.8 | Partial | Ensure private home address is never displayed; provide curated area links and contact CTA. |
| Dress Code (Cocktail) | §7.9 | OK | Maintain elegant typographic display and formality guidelines. |
| Music (Spotify & Song Requests) | §7.10 | OK | Embedded Spotify player (lazy loaded) + up to 3 guest song requests with live search and independent save. |
| Gifts Section | §7.11 | Partial | Connect to `showGiftDetails` configuration toggle; preserve toaster copy. |
| RSVP System | §7.12 | OK | Enforce max guest cap, plus-one toggle, dietary requirements, independent save, and editability. |
| Closing Message & Footer | §7.13 | OK | Polish typography, couple names, and privacy link. |
| Admin Dashboard & Overview | §8 | Partial | Create clean KPI cards (total invites, opened %, confirmed guests vs capacity, song count). |
| Admin Invitations Management | §8 | Partial | Build search, group filter, status badges, edit/revoke modal, and token URL copier. |
| QR Code Generation | §8 | Missing | Add client-side / server-side SVG QR code generator for invitation links with download options. |
| CSV Guest List Bulk Import | §8 | Missing | Build CSV parser and validator with template download and database seeding. |
| Admin RSVPs Management | §8 | Partial | Build dedicated RSVP manager with filter, dietary summary, notes viewer, and CSV export. |
| Admin Song Requests | §8 | Partial | Add song request table with frequency sorting, Spotify link out, and playlist selection flag. |
| Admin Analytics | §8 | Weak | Build event timeline per invite and client-side visit tracker. |
| Admin Settings | §8 | Missing | Implement toggle interface for `showGiftDetails`, `showPrivateAddress`, and Spotify playlist URL. |
| Admin Danger Zone | §8 | Partial | Provide typed confirmation modal ("DELETE WEDDING DATA") with server action execution. |
| Motion Language & Tokens | §9 | Weak | Centralize motion tokens in `lib/motion/tokens.ts` and apply editorial reveals. |
| Security & Privacy | §10 | OK | 256-bit tokens, SHA-256 hashing, RLS policies, rate limiting, and noindex headers. |

---

## 4. Environment Variables Audit

The following table documents all environment variables required by the system, identifying current status and additions:

| Variable | Scope | Status in `.env.example` | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public / Server | Present | Base URL for absolute links, invitation URLs, and QR codes (e.g. `http://localhost:3000` or production domain). |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Server | Present | Supabase project API endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Present | Supabase anonymous public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Present | Elevated key for secure token queries, rate limiting, and admin operations. |
| `ADMIN_EMAIL` | Server Only | Missing (was `ADMIN_EMAIL_ALLOWLIST`) | Primary admin user email for authorization checks. |
| `ADMIN_EMAIL_ALLOWLIST` | Server Only | Present | Comma-separated list of authorized admin emails. |
| `LOOKUP_RATE_LIMIT_SECRET` | Server Only | Present | Secret salt for rate limiting tokens. |
| `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL` | Public / Client | Present | Fallback URL to open the wedding playlist on Spotify. |
| `SPOTIFY_CLIENT_ID` | Server Only | Present | Spotify Developer App client ID for API searches. |
| `SPOTIFY_CLIENT_SECRET` | Server Only | Present | Spotify Developer App client secret. |
| `SPOTIFY_PLAYLIST_ID` | Server Only | Present | Target Spotify playlist ID for guest song additions. |
| `SPOTIFY_REFRESH_TOKEN` | Server Only | Present | OAuth refresh token for playlist automation. |
| `SPOTIFY_REDIRECT_URI` | Server Only | Present | OAuth callback URI for developer authorization script. |

---

## 5. Keep, Rewrite, or Delete Decisions

| File / Component | Decision | Justification |
|---|---|---|
| `app/page.tsx` | Rewrite | Replace the guest lookup form with a neutral, elegant invitation landing that directs guests to check their private link. |
| `app/actions/lookup-invitation.ts` & test | Delete / Retire | Public lookup by name/phone contradicts the private opaque token security model and was failing test expectations. |
| `components/invitation/invitation-lookup-card.tsx` | Delete | No longer needed on the neutral home page. |
| `app/i/[token]/page.tsx` | Rewrite | Transform into the dedicated, immersive 3D envelope intro experience without couple photos. |
| `app/i/[token]/invitation/page.tsx` | Create | New dedicated page housing the full editorial wedding website. |
| `components/invitation/invitation-intro.tsx` | Rewrite | Replace standard `<dialog>` with realistic 3D envelope, wax seal crack, card sliding, and SVG orchid linework drawing. |
| `public/images/botanicals/music-orchid.svg` | Replace | Replace with full suite of 6 bespoke botanical SVG assets in `public/orchids/`. |
| `lib/sound/` | Create | New audio module with `SoundProvider`, Web Audio synthesis, and persistent mute state. |
| `app/admin/` | Rewrite & Modularize | Break monolithic admin into dedicated pages: `/admin/login`, `/admin/invitations`, `/admin/rsvps`, `/admin/music`, `/admin/analytics`, `/admin/settings`, `/admin/danger`. |
| `app/dev/botanical/page.tsx` | Create | Dev-only preview gallery for testing and visual QA of botanical assets. |
| `lib/wedding-config.ts` | Refine | Align locales to clean `["en", "es", "de", "hu"]` and ensure all wedding metadata is accurate. |
| `lib/motion/tokens.ts` | Create | Centralize easing, springs, durations, and stagger tokens. |
| `scripts/optimize-images.ts` | Keep | Image optimization pipeline already works cleanly and produces AVIF/WebP responsive derivatives. |
| `supabase/migrations/` | Keep & Extend | Schemas are sound. Add any missing settings keys or audit columns as needed. |

---

## 6. Phase Execution Blueprint

1. **Phase 2 — Foundation & Routing**:
   - Establish route boundaries: `/`, `/i/[token]`, `/i/[token]/invitation`, `/admin/*`, `/dev/botanical`.
   - Normalize locales (`en`, `es`, `de`, `hu`) in config and `next-intl`.
   - Update `.env.example` and motion tokens.
2. **Phase 3 — Botanical Artwork Suite**:
   - Author 6 clean, handcrafted SVG botanical assets in `public/orchids/`.
   - Build `/dev/botanical` preview page.
3. **Phase 4 — Intro Experience & Sound Architecture**:
   - Build `lib/sound` synthesizer and state provider.
   - Implement 3D envelope, wax seal interaction, card slide, and linework animation on `/i/[token]`.
4. **Phase 5 — Main Invitation Components & Editorial Motion**:
   - Assemble `app/i/[token]/invitation/page.tsx` with editorial layout, timeline line-drawing, photo reveals, and responsive typography.
5. **Phase 6 — Data, RSVP, Songs, & Tracking**:
   - Validate RSVP submission, guest limit enforcement, 3-song requests, and client-side visit tracking.
6. **Phase 7 — Complete Admin Suite**:
   - Implement admin sub-pages, QR code generator/download, CSV bulk import, RSVP filtering, music management, and settings toggles.
7. **Phase 8 — Localization Pass**:
   - Review and harmonize EN, ES, DE, HU translations. Verify alignment test.
8. **Phase 9 — QA, Performance, & Accessibility**:
   - Run typecheck, unit tests, linting, build, and accessibility audits.
