# Ruben & Andrea — Wedding Invitation & Guest Experience System

> **Date:** October 2, 2027  
> **Location:** Vienna, Austria (Ceremony: St. Elisabeth · Reception: Schloss Neugebäude)  
> **Languages Supported:** English (`en`), Spanish (`es`), German (`de`), Hungarian (`hu`)

---

## 1. Project Overview

This repository houses the custom, luxury digital wedding invitation and administrative management platform for Ruben & Andrea's wedding in Vienna. Designed to capture the tactility and prestige of bespoke wedding stationery, the application blends modern web engineering with refined editorial aesthetics:

- **Bespoke 3D Envelope Experience:** Interactive physical wax seal break, envelope flap lift, letter extraction, and smooth transition into the full wedding website.
- **Procedural Web Audio Synthesis:** Zero-licensing sound effects (paper rustles, wax seal snap, delicate chime) generated entirely via the browser's Web Audio API with strict user gesture requirements and persistent mute toggles.
- **Curated Botanical Linework & Vector Art:** High-fidelity botanical vector assets modeled after real orchid species (*Phalaenopsis*, *Cattleya*, *Paphiopedilum*), completely eliminating generic clip art.
- **Multi-Tenant Guest Privacy:** Zero public photo exposure on the neutral gate; personalized tokens with cryptographically hashed lookups, alias support, and rate-limited API routes.
- **Comprehensive Admin Portal:** Real-time guest RSVP tracking, song request moderation, automated QR code generation (SVG & PNG), bulk CSV import, site settings management (bank details & home address disclosures), SMTP server configuration, and WhatsApp integration with anti-ban rate limiting.

---

## 2. Architecture & Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | Next.js 16.3 (Turbopack, App Router, React 19) |
| **Database & Auth** | Supabase Postgres with Row Level Security (RLS) & Server-Side HMAC Sessions |
| **Styling** | Vanilla CSS Tokens & Utility-first Layouts (Responsive, Fluid Typography) |
| **Motion** | Framer Motion (Bespoke Bézier curves, spring physics, full `prefers-reduced-motion` compliance) |
| **Audio** | Procedural Web Audio API Synthesizer (Zero external `.mp3` assets, no copyright risk) |
| **Mapping** | Leaflet + OpenStreetMap (Ceremony & Reception pins, tile fallback handling) |
| **Localization** | `next-intl` (4 synchronized locales: `en`, `es`, `de`, `hu`) |
| **Code Quality** | ESLint 9, TypeScript strict mode, Vitest unit test suite |

---

## 3. Quick Start: Local Setup & Running the Project

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Supabase Instance**: Active Supabase project (credentials are pre-configured in `.env.local` / `.env`)

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Ensure your `.env.local` file contains the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD=your_secure_admin_password
SESSION_SECRET=your_32_character_random_hex_string
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Manual Evaluation Guide (Step-by-Step)

Follow this structured checklist to evaluate the entire project manually:

### Step 1: The Neutral Gate (`/`)
1. Navigate to: [http://localhost:3000](http://localhost:3000)
2. **Observe:** The public gate displays a neutral, elegant monogram card. No private photos or sensitive wedding details are exposed.
3. **Language Switcher:** Toggle between English, Español, Deutsch, and Magyar in the upper corner. All typography and copy adjust instantaneously.
4. **Name Lookup:** Test the lookup input by entering a guest name or token.

### Step 2: The 3D Interactive Envelope Intro (`/i/demo`)
1. Navigate directly to the built-in demo invitation:  
   👉 **[http://localhost:3000/i/demo](http://localhost:3000/i/demo)**
2. **First Glance:** An envelope rendered with fine paper texture, embossed gold accents, and a custom monogram wax seal ("R & A").
3. **Sound Control:** Notice the sound toggle icon at top right. Sound is muted by default (respecting autoplay policies). Click it to enable Web Audio synthesis.
4. **Interact:** Click the Wax Seal:
   - A crisp, tactile snap sound plays.
   - The seal cracks and fades.
   - The envelope flap folds upward in 3D perspective.
   - The personalized letter card slides up and unfolds.
   - A soft chime accompanies the presentation of the guest's name (*Sarah & Guest*).
5. **Proceed:** Click **"Open Invitation"** to smoothly transition into the editorial website.

### Step 3: The Editorial Wedding Invitation (`/i/demo/invitation`)
1. **Hero Section:**
   - Review the editorial typography and high-fashion couple portrait.
   - Live Countdown timer ticking down to October 2, 2027.
2. **Schedule of Events:**
   - Step-by-step breakdown: Arrival, Ceremony (14:00 at St. Elisabeth), and Reception (~16:30 at Schloss Neugebäude).
3. **Photo Story & Closing Note:**
   - Editorial photo carousel showcasing moments from the couple's journey.
   - Personal letter to guests from Ruben & Andrea.
4. **Interactive Map:**
   - Smooth Leaflet map centered on Vienna with custom pins for both venues.
   - One-click links for Apple Maps, Google Maps, and public transit directions.
5. **Travel & Where to Stay (Privacy Testing):**
   - Direct transit and flight suggestions (OEBB, Ryanair, Vienna Airport Train).
   - Recommended Vienna Meidling hotel/Airbnb options.
   - **Private Home Address Check:** By default, the couple's private home address is hidden behind a discreet recommendation CTA ("Reach out directly to Ruben & Andrea"). When enabled in Admin Settings, the exact Vienna residence and access notes appear here.
6. **Dress Code & Spotify Music Section:**
   - Dress code guidelines (Black Tie Optional / Formal).
   - Embedded Spotify wedding playlist player.
   - **Interactive Song Requests:** Submit up to 3 song requests with live feedback.
7. **Gift Details & "No Toaster" Policy (Accordion Testing):**
   - Humorous message requesting the presence of guests rather than household appliances.
   - **Bank Info Accordion Check:** Controlled dynamically by Admin Settings. When disabled, only the humorous note is shown. When enabled, a collapsible accordion reveals IBAN, BIC, and transfer instructions.
8. **Live RSVP Form:**
   - Toggle "Will Attend" / "Cannot Attend".
   - Set guest count (up to max allowed).
   - Enter guest names, dietary restrictions (vegetarian, vegan, allergies), and notes.
   - Click **"Send RSVP"** — receive immediate visual confirmation.

### Step 4: Botanical Linework & Vector Asset Showcase (`/dev/botanical`)
1. Navigate to: [http://localhost:3000/dev/botanical](http://localhost:3000/dev/botanical)
2. **Inspect:** 6 bespoke, handcrafted SVG assets:
   - `orchid-stem-cascade.svg` (Orchid stem with delicate florets and buds)
   - `orchid-single-bloom.svg` (Detailed Cattleya bloom with labellum detailing)
   - `orchid-linework.svg` (Fine-art botanical line drawing)
   - `orchid-corner.svg` (Corner flourish for stationery cards)
   - `orchid-pattern.svg` (Subtle botanical backdrop tile)
   - `seal-monogram.svg` (Vector wax seal with "R & A" monogram)
3. Zero raster artifacts; perfectly sharp at any zoom level.

### Step 5: Admin Portal Walkthrough (`/admin`)
> **Note:** The Admin Portal link is deliberately omitted from public navigation and footers to ensure privacy and prevent unauthorized access. Administrators access the portal strictly via the direct URL.

1. Navigate directly to: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. **Log In:** Enter the password defined in your `ADMIN_PASSWORD` environment variable (e.g. `wedding2027admin`).
3. **Explore Admin Features:**
   - **Dashboard (`/admin`):** High-level metrics displaying total invitations, RSVP response rate, confirmed attendees, and guest dietary requirements.
   - **Manage Invitations (`/admin/invitations`):**
     * Click **"+ Create Invitation"** to generate new guest links.
     * Click **"★ Create Demo Guest (1-Click)"** to instantly seed a test guest.
     * Click **"Copy Link"** for instant clipboard sharing.
     * Click **"QR Code"** to preview and download high-resolution SVG or PNG QR codes.
     * Click **"WhatsApp"** to initiate a direct WhatsApp invitation with pre-filled message text.
   - **Bulk CSV Import (`/admin/invitations/import`):**
     * Download the standard CSV template.
     * Upload guest lists containing name, email, phone, language, and guest allowances.
   - **RSVPs (`/admin/rsvps`):** View, filter, and export guest responses and dietary restrictions.
   - **Song Requests (`/admin/music`):** Moderate music requests submitted by guests.
   - **Analytics & Audit Logs (`/admin/analytics`):** Track invitation open rates and administrative actions.
   - **Settings & Integrations (`/admin/settings`):**
     * **Gift Details Accordion:** Toggle on/off and fill in Bank Name, IBAN, BIC, and Reference.
     * **Private Home Address:** Toggle on/off and enter the couple's private Vienna address.
     * **SMTP Server Settings:** Configure custom SMTP credentials (Host, Port, User, Password, Sender Name) for automated email delivery.
     * **WhatsApp Automated Distribution:** Configure personalized message templates, anti-spam delay timers (8–15 seconds) to prevent account bans, and security unlinking policies.
   - **Danger Zone (`/admin/danger`):** Tools for resetting demo data and performing maintenance.

---

## 5. WhatsApp & SMTP Dispatch Setup

### WhatsApp Integration & Anti-Ban Protection
The application provides two WhatsApp dispatch methods:
1. **Direct Guest Sharing (Zero Setup):** In `/admin/invitations`, clicking the "WhatsApp" button on any guest row automatically generates a localized message containing their personalized URL and opens WhatsApp Web / mobile app.
2. **Automated Batch Distribution:** In `/admin/settings`, configure:
   - **Template:** Custom message syntax supporting `{name}` and `{url}` placeholders.
   - **Interval Delay:** A configurable timer (default: 8–12 seconds) between outgoing messages. This staggering simulates human interaction and protects your WhatsApp number from automated spam detection filters.
   - **Session Security:** When using a linked WhatsApp Web session, the session token is automatically flushed and unlinked once the batch completes to prevent unauthorized access.

### SMTP Server Configuration
In `/admin/settings`, enter your SMTP server credentials:
- **Host:** e.g., `smtp.mailgun.org`, `smtp.sendgrid.net`, or `smtp.gmail.com`
- **Port:** `587` (STARTTLS) or `465` (SSL)
- **User & Password:** Your authenticated mailer credentials
- **Sender Name & Address:** e.g., `Ruben & Andrea <wedding@yourdomain.com>`

---

## 6. Production Deployment Guide

### Deploying to Vercel
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Production release"
   git push origin main
   ```
2. Import the project in [Vercel](https://vercel.com).
3. Set the Framework Preset to **Next.js**.
4. Configure the following Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (Set to your custom domain, e.g., `https://ruben-andrea.com`)
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
5. Click **Deploy**. Vercel will build the application using Turbopack with zero warnings or errors.

### Supabase Database Migration
If setting up a fresh Supabase database:
1. Open your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Run the schema migrations located in:
   - `supabase/migrations/20261003212512_secure_guest_lookup.sql`
   - `supabase/schema_all.sql`
4. Confirm tables (`invitations`, `rsvps`, `song_requests`, `site_settings`, `invitation_events`, `admin_audit_logs`) and RPC functions are created.

---

## 7. Verification & Quality Gates

The codebase enforces strict quality checks:
```bash
# Verify TypeScript typing
npm run typecheck

# Run unit and integration tests
npm test

# Run ESLint compliance check
npm run lint

# Compile production build
npm run build
```

---

## 8. License & Botanical Asset Attribution

All orchid illustrations and wax seal monograms in `public/orchids/` are handcrafted vector artworks created exclusively for this project under the MIT License. No third-party royalty fees, subscriptions, or restrictive licenses apply. For complete details, see [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md).
