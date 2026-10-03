# Wedding Invitation Website — Full Product & Technical Specification

## 1. Project Overview

Create a premium, romantic, multilingual wedding invitation website for the wedding taking place on **2 October 2027 in Vienna, Austria**.

The website should feel like a personal digital invitation rather than a generic wedding template. Each invited guest should receive a **unique private invitation URL**. When they open it, the site should identify the invitation, show a personalized opening animation using their name, remember their language, and allow them to confirm attendance and optionally submit up to three song requests.

The website should be designed as a **mobile-first PWA-style experience**, but also look excellent on desktop.

The primary visual identity is:

- **Strawberry-matcha** palette: soft strawberry / dusty pink tones combined with muted matcha / sage green.
- **Orchids** as the main floral motif.
- Elegant typography with a mixture of editorial serif typography and clean modern sans-serif text.
- Light, romantic, sophisticated, contemporary aesthetic.
- Subtle animations rather than heavy effects.
- Accessibility-friendly contrast and typography. Do not communicate important information through color alone.

---

# 1A. Existing Repository Context

This specification is implemented inside an existing repository that already contains reusable skills, previous wedding website templates, and a private photo source folder. Those resources must be treated as context and inspiration, not as the final visual design.

```text
.github/
├── skills/
│   ├── design-system/
│   ├── design-taste-frontend/
│   ├── email-design-eng/
│   ├── impeccable/
│   ├── industry-research/
│   ├── next-template-selector/
│   ├── redesign-existing-projects/
│   └── website-template/
Resources/
└── Photos/
Templates previously designed/
├── wedding-classic/
├── wedding-deco/
├── wedding-garden/
├── wedding-modern/
└── wedding-rustic/
wedding_invitation_website_spec.md
```

### Rules for previous templates

The five folders under `Templates previously designed/` can be inspected to identify reusable ideas such as component patterns, layout mechanics, spacing systems, interaction patterns, animation approaches, or implementation techniques. Do not copy them as a visual template. The new site must have its own art direction based on strawberry-matcha, orchids, Vienna, and the couple's real photography.

### Rules for existing skills

The `.github/skills/` folders are project context. Read the relevant `SKILL.md` files when a task matches them. Prefer their reusable principles over re-inventing equivalent patterns.

### Photo source

`Resources/Photos/` contains the couple's original photos. Treat these files as private source assets. Runtime pages must use optimized derivatives created by the project's image pipeline.

### Free public skills

Useful public skills may be installed or referenced when they add expertise, especially Vercel React Best Practices, Web Design Guidelines, and the official Motion React skill. Public skills provide engineering/design guidance; they do not define the wedding's visual identity.

---

# 2. Wedding Information

## Date

**Saturday, 2 October 2027**

Internal machine-readable value:

```text
2027-10-02
```

## Ceremony — Location #1

**Catholic Church of Altmannsdorf (St. Oswald)**  
**Kath. Kirche St. Oswald**

Khleslpl. 10  
1120 Wien, Austria

### Ceremony time

**15:00 / 3:00 PM**

### Important guest instruction

> Please arrive **30 minutes earlier**. Seriously. Please.

Recommended displayed arrival time:

**14:30 / 2:30 PM**

The website should visually emphasize the arrival time separately from the ceremony time.

---

# 3. Reception — Location #2

**Hetzendorf Palace**  
**Schloss Hetzendorf**

Hetzendorfer Str. 79  
1120 Wien, Austria

### Reception time

Immediately after the church ceremony.

Expected arrival:

**~17:00 / 5:00 PM**

End:

**Until the body can stand it.**

This phrase should be preserved as part of the personality of the invitation and can be displayed with a small humorous treatment.

---

# 4. Recommended Website Information Architecture

The invitation should be implemented as one elegant scrolling experience with optional modal/drawer components.

Recommended page structure:

```text
1. Personalized Opening / Envelope
2. Hero Invitation
3. Wedding Countdown
4. Our Day / Timeline
5. Ceremony Location
6. Reception Location
7. How to Get There
8. Where to Stay
9. Dress Code
10. Music / Song Requests
11. Gifts
12. RSVP / Attendance Confirmation
13. Final Message
14. Footer
```

Optional secondary routes:

```text
/invite/[token]
/admin
/admin/invitations
/admin/rsvps
/admin/music
/admin/analytics
/privacy
```

---

# 5. Personalized Invitation Experience

## Goal

Every invitation must be generated for a specific guest or group of guests.

Example concept:

```text
https://wedding.example.com/i/X7k92LqP...
```

Do **not** put the guest's full name directly in the URL whenever possible. Use an opaque random invitation token to reduce accidental exposure of personal information and prevent easy enumeration.

## Opening animation

When the invitation is opened:

1. Full-screen light background.
2. Subtle orchid petals / botanical animation.
3. A closed digital envelope or invitation card appears.
4. Guest name fades in.
5. Invitation opens with a soft transition.
6. Main invitation content is revealed.

Example personalized wording:

```text
Dear Jonathan,

you are invited to celebrate our wedding with us.

02.10.2027 · Vienna
```

For a family/group invitation, support a configurable display name such as:

```text
Dear Jonathan & Friends,
```

or

```text
Dear Jonathan and Family,
```

The exact greeting must be stored per invitation, rather than generated only from first/last name.

## Personalization fields

Each invitation record should support:

- invitee display name
- preferred language
- invitation group name
- number of guests invited
- invitation token
- RSVP status
- plus-one allowed
- dietary information enabled/disabled
- invitation message override
- invitation opened timestamp
- RSVP timestamp
- last visit timestamp

---

# 6. Languages

The website must support:

- English (`en`)
- Spanish (`es`)
- German (`de`)
- Hungarian (`hu`)

## Language behavior

Priority order:

1. Language explicitly stored on the guest invitation.
2. Language selected manually by the guest.
3. Browser language as fallback.
4. English as final fallback.

A language selector should remain accessible from the header.

Changing language must preserve the invitation token and current RSVP/session state.

Example:

```text
EN | ES | DE | HU
```

All fixed content should be stored in translation files, not hardcoded inside components.

Recommended structure:

```text
/locales
  /en/common.json
  /es/common.json
  /de/common.json
  /hu/common.json
```

---

# 7. Hero Section

The hero should immediately communicate:

- Couple names
- Wedding date
- Vienna
- Personalized guest greeting

Example content structure:

```text
[Couple Names]

We are getting married

02 October 2027
Vienna, Austria

[Scroll / Open Invitation]
```

Visual details:

- Large editorial serif names.
- Orchid illustration or photograph.
- Strawberry-matcha botanical background.
- Very subtle floating/petal movement.
- No aggressive parallax that affects performance.

---

# 8. Countdown

Display:

```text
[Days] [Hours] [Minutes] [Seconds]
```

Countdown target:

```text
2027-10-02
15:00
Europe/Vienna
```

After the ceremony start time has passed, automatically replace the countdown with an event message such as:

```text
Today is the day!
```

Avoid relying exclusively on browser-local time. The target event timezone is **Europe/Vienna**.

---

# 9. Our Day / Timeline

Create a visual timeline:

```text
14:30
Please arrive

15:00
Catholic ceremony

~17:00
Reception at Hetzendorf Palace

17:00 → late
Dinner, music, dancing & questionable decisions
```

The tone may remain elegant while allowing small humorous moments.

The church arrival instruction should be one of the most prominent timeline items.

---

# 10. Location Section

Create two separate location cards.

## Card #1 — Church

```text
Catholic Church of Altmannsdorf (St. Oswald)
Kath. Kirche St. Oswald

Khleslpl. 10
1120 Wien, Austria

Ceremony
15:00

Please arrive by 14:30
```

Buttons:

```text
Open in Google Maps
Get Directions
```

## Card #2 — Reception

```text
Hetzendorf Palace
Schloss Hetzendorf

Hetzendorfer Str. 79
1120 Wien, Austria

From ~17:00
Until the body can stand it
```

Buttons:

```text
Open in Google Maps
Get Directions
```

## Map implementation

Use Google Maps Embed for the visual map where appropriate. Google documents Maps Embed API as available at no charge with unlimited requests, while still requiring an API key and Google Cloud setup. See: https://developers.google.com/maps/documentation/embed/quickstart

Alternative ultra-simple implementation:

- Use a normal Google Maps destination link for navigation.
- Use an embedded map only on the location page/section.

This avoids implementing a custom mapping system.

---

# 11. Transport / Directions

Provide a simple "How to get there" section.

Suggested subsections:

```text
By Public Transport
By Car
From the City Center
Between Church and Palace
```

The website should not hardcode transit schedules. Instead, provide links that open the location in Google Maps so guests can use live directions on the day.

A dedicated CTA can say:

```text
Get directions to the church
```

and after the church:

```text
Get directions to Hetzendorf Palace
```

---

# 12. Where to Stay

Use this wording as the basis for the section:

> We live in Sagedergasse 21A. It is a residential area that is very quiet and comfortable, so you can try to find a place around here if that works for you.
>
> If you would rather stay in the city center, this area is very well connected with the U6 metro.
>
> If you would like recommendations regarding hotels or Airbnbs, don't hesitate to reach out.

Important privacy consideration:

The exact home address should **not necessarily be shown publicly on the main invitation**. Recommended design:

```text
Where to stay?

A quiet residential area with very good U6 connections.

[Ask us for recommendations]
```

The exact private home address can be provided only to guests when appropriate, for example through a personalized invitation configuration or a contact button.

If the hosts explicitly want it displayed, create a separate protected/private content flag for it.

---

# 13. Dress Code

Display as a stylish visual card:

```text
Dress Code

COCKTAIL

Come dressed for a good party.

If you want to go formal, please do.
```

Suggested UI:

- Small dress/suit icon.
- Large "COCKTAIL" typography.
- Optional reference images later.

Do not require guests to upload clothing photos.

---

# 14. Gifts Section

The wording should communicate that monetary gifts are preferred without sounding overly transactional.

Possible copy direction:

```text
Your Presence Is the Gift

Having you there to celebrate with us is already more than enough.

But since you asked what we would like as a gift:
we are saving for our next adventures together, so a contribution
would be much more useful than another toaster.

Thank you for helping us turn a wedding gift into future memories.
```

Provide optional payment information behind a button:

```text
Gift Details
```

The actual bank/payment details should be stored in configuration rather than hardcoded in the frontend.

Recommended approach:

```text
showGiftDetails: true/false
```

This makes it possible to temporarily hide them.

---

# 15. Music Section

## Requirement

The couple has three favorite songs they would like guests to hear.

The website should support two different concepts.

### A. Couple's official three-song playlist

Display:

```text
Our Three Songs

01. [Song]
02. [Song]
03. [Song]
```

Use Spotify playlist/embed functionality.

Spotify officially supports embedding tracks, albums, podcasts and playlists into websites, including via iframe. citeturn103023search1turn103023search3

Recommended implementation for the MVP:

- Create the playlist manually in Spotify.
- Put the Spotify playlist URL in environment/configuration.
- Render it in the website using Spotify's official embed.

This is significantly simpler than building a full Spotify account integration.

### B. Guest song requests

Add an RSVP field:

```text
Which 3 songs would you love to hear at our wedding?

Song 1 [__________]
Song 2 [__________]
Song 3 [__________]
```

Optional enhancement:

```text
Search Spotify
```

For the first version, free-text song entries are recommended because they remove the need for guests to authorize Spotify.

Store:

- song title
- artist
- optional Spotify URL
- submitted by invitation
- submission timestamp

The admin panel can later export all requests into CSV or manually add selected requests to the wedding playlist.

### Important Spotify behavior

Do not rely on automatic autoplay. Modern browsers commonly restrict audio autoplay. Make the Spotify player explicit and user-initiated.

---

# 16. RSVP / Attendance Confirmation

This is a central feature.

## Primary CTA

```text
RSVP
```

The RSVP form should be personalized using the invitation.

### Basic fields

```text
Will you join us?

( ) Yes, absolutely!
( ) Sadly, I can't make it
```

If the guest answers yes:

```text
Number of guests attending

[ 1 ]
```

The allowed maximum should come from the invitation record rather than being freely editable.

Optional fields:

```text
Names of additional guests
Dietary requirements
Allergies
Notes for the couple
```

The user should not have to re-enter their name because it is already known from the invitation token.

### Confirmation state

After submitting:

```text
Thank you, Jonathan!

Your attendance has been confirmed.

We can't wait to celebrate with you.
```

Or for a declined invitation:

```text
Thank you for letting us know.

We are sorry you won't be able to join us,
but we appreciate your reply.
```

Allow a guest to edit their RSVP later using the same private invitation URL.

---

# 17. Invitation Tracking / Analytics

## Requirement

The couple wants to know:

- Who opened their invitation.
- When it was opened.
- Who confirmed attendance.
- Who declined.
- Who has not responded.
- Potentially how many times an invitation has been opened.
- Which language was used.
- When the most recent visit occurred.

## Recommended privacy-preserving model

Track the invitation through the random invitation token rather than attempting to identify guests through IP address.

Example events:

```text
INVITE_OPENED
RSVP_STARTED
RSVP_CONFIRMED
RSVP_DECLINED
LANGUAGE_CHANGED
SONG_REQUESTED
```

Store:

```text
invitation_id
session_id
anonymous_event_id
event_type
timestamp
locale
```

Avoid unnecessary collection of:

- raw IP addresses
- precise geolocation
- browser fingerprinting
- unnecessary tracking cookies

For an Austrian/EU wedding website, implement a privacy notice and collect only the information necessary for invitation functionality. Have the final privacy/legal implementation reviewed appropriately before public launch.

## Dashboard examples

Admin dashboard:

```text
Total Invitations        120
Opened                   91
RSVP Yes                 64
RSVP No                   7
Awaiting Reply           20

Open Rate                75.8%
Attendance Rate*         56.7%

*Define the denominator clearly in the dashboard.
```

Guest table:

```text
Guest                     Opened      RSVP       Last Activity
Jonathan & Partner        Yes         Yes        2027-08-21 19:34
Maria                     Yes         Pending    2027-08-20 10:12
Peter & Anna               No          Pending    —
```

---

# 18. Admin Dashboard

The frontend invitation is public/private-by-token, but administration must be authenticated.

## Admin sections

```text
Dashboard
Invitations
RSVPs
Music Requests
Analytics
Settings
```

## Invitation management

Admin can:

- Create invitation.
- Edit guest display name.
- Set language.
- Set maximum guests.
- Enable/disable plus-one.
- Generate invitation token.
- Copy invitation URL.
- Generate QR code.
- See opened/not opened.
- See RSVP status.
- Revoke invitation.

## RSVP management

Admin can:

- Filter Yes / No / Pending.
- Search guest.
- View dietary information.
- View notes.
- Export CSV.

## Music requests

Admin can:

- View all song suggestions.
- Search/filter by song.
- Count frequency of requests.
- Export CSV.
- Mark requests as selected for playlist.
- Optionally store Spotify URL.

---

# 19. Data Model

Recommended database: PostgreSQL via Supabase.

## `invitations`

```text
id UUID PRIMARY KEY
invite_token TEXT UNIQUE NOT NULL
display_name TEXT NOT NULL
language TEXT DEFAULT 'en'
group_name TEXT NULL
max_guests INTEGER DEFAULT 1
plus_one_allowed BOOLEAN DEFAULT false
personal_message TEXT NULL
status TEXT DEFAULT 'active'
created_at TIMESTAMP
updated_at TIMESTAMP
```

## `rsvps`

```text
id UUID PRIMARY KEY
invitation_id UUID REFERENCES invitations(id)
attendance_status TEXT NOT NULL
attendee_count INTEGER DEFAULT 1
guest_names TEXT NULL
dietary_requirements TEXT NULL
notes TEXT NULL
submitted_at TIMESTAMP
updated_at TIMESTAMP
```

Recommended `attendance_status` values:

```text
yes
no
pending
```

## `song_requests`

```text
id UUID PRIMARY KEY
invitation_id UUID REFERENCES invitations(id)
slot INTEGER NOT NULL
song_title TEXT NOT NULL
artist TEXT NULL
spotify_url TEXT NULL
submitted_at TIMESTAMP
```

Constraint:

```text
slot = 1, 2, or 3
```

## `invitation_events`

```text
id UUID PRIMARY KEY
invitation_id UUID REFERENCES invitations(id)
event_type TEXT NOT NULL
session_id TEXT NULL
locale TEXT NULL
created_at TIMESTAMP
```

## `site_settings`

Useful for configuration:

```text
couple_names
wedding_date
timezone
church_name
church_address
reception_name
reception_address
spotify_playlist_url
contact_email
contact_phone
show_gift_details
show_private_address
```

Store sensitive/payment details securely and never expose database credentials to the browser.

---

# 20. Backend API Requirements

Recommended API endpoints:

```text
GET    /api/invitation/[token]
POST   /api/invitation/[token]/open
GET    /api/invitation/[token]/rsvp
POST   /api/invitation/[token]/rsvp
PUT    /api/invitation/[token]/rsvp
POST   /api/invitation/[token]/songs
```

Admin APIs:

```text
GET    /api/admin/invitations
POST   /api/admin/invitations
PUT    /api/admin/invitations/[id]
DELETE /api/admin/invitations/[id]
GET    /api/admin/rsvps
GET    /api/admin/songs
GET    /api/admin/analytics
GET    /api/admin/export/rsvps
GET    /api/admin/export/songs
```

Backend validation must occur server-side even when frontend validation is present.

---

# 21. Security Requirements

## Invitation tokens

Use cryptographically random tokens.

Example conceptual format:

```text
32 bytes / 256-bit random token
```

The token should be unguessable.

## Authorization

The guest invitation endpoint can be public only when the request contains a valid invitation token.

Admin routes must require authentication.

## Database security

Use Supabase Row Level Security (RLS) or equivalent database policies.

Guests should only be able to access records associated with their invitation token.

Guests must never be able to enumerate all invitations.

## API abuse protection

Use basic rate limiting where practical, especially for:

```text
RSVP submission
Song request submission
Invitation open events
Admin login
```

---

# 22. Privacy / GDPR Considerations

Because the event is in Austria and the site may be accessed by EU residents, design the system with data minimization in mind.

Suggested privacy page:

```text
Privacy

This website is used solely to manage our wedding invitation,
attendance confirmations and music requests.

We only collect information necessary to organize the event.

We do not sell guest information.

Contact: [couple contact]
```

The exact legal wording, retention policy and consent requirements should be reviewed before production launch.

Recommended retention configuration:

```text
Invitation information: until after the event + defined cleanup period
Analytics events: limited retention
RSVP data: until operationally no longer needed
```

Add an admin action:

```text
Delete wedding data
```

This should permanently remove the stored data once it is no longer required.

---

# 23. Design System

## Colors

Use a strawberry-matcha palette, for example:

```text
Strawberry 1: #E8A0A8
Strawberry 2: #F6CDD1
Strawberry 3: #FFF1F2

Matcha 1: #A7B89B
Matcha 2: #C8D7BE
Matcha 3: #EEF3E9

Neutral 1: #FFFDFC
Neutral 2: #F7F4F0
Text:       #30312E
```

These are starting tokens, not final art direction.

Because color perception may vary between viewers, important information must also use:

- labels
- icons
- typography
- shapes
- borders
- spacing

rather than relying only on color.

## Floral motif

Use orchid illustrations/photos as the primary decorative visual language. Wedding-specific decorative artwork should live in the repository as optimized SVG/PNG assets; original couple photographs remain under `Resources/Photos/` and are never exposed directly.

Best option for a free project:

- Create/commission a small original orchid SVG/illustration.
- Or use properly licensed free assets.
- Store only optimized runtime derivatives inside `/public`, never the original couple photos. Do not depend on random external image hosts for production-critical assets.

---

# 24. Typography

Recommended free font combination:

```text
Display Serif:
Playfair Display / Cormorant Garamond

Sans-serif:
Inter / DM Sans
```

Prefer self-hosting or a stable free font package where licensing allows, to reduce external dependencies.

---

# 25. Animation Requirements

Animations should feel elegant and premium.

Recommended effects:

### Opening

- Envelope/card scale-in.
- Orchid petals gently move.
- Name fade-in.
- Invitation reveal.

### Scroll

- Gentle fade-up sections.
- Botanical elements move slightly.
- Timeline items reveal as they enter viewport.

### RSVP success

- Small orchid bloom animation.
- Check mark or heart animation.

### Animation art direction rule

The animation system must look intentionally authored rather than AI-generated. Prefer a small number of sophisticated scenes over many generic effects. Use the real wedding photography, orchid SVGs, masking, path drawing, depth, carefully timed stagger, and editorial transitions to create the sense of a luxury digital invitation. Avoid repetitive `fade-up` effects on every block.

Recommended hierarchy:

1. CSS for simple hover/opacity/transform transitions.
2. Motion for component-level React animation, scroll-linked reveals, layout transitions, gestures, and reduced-motion handling.
3. GSAP only for complex cinematic timelines or advanced SVG sequencing where its timeline model materially improves the result.

See the repository Copilot instructions for the exact motion quality bar and free-skill references.

### Important performance rule

Respect:

```text
prefers-reduced-motion
```

When reduced motion is enabled, replace animated transitions with simple fades or no motion.

---

# 26. Responsive Design

Design first for mobile.

Breakpoints should support at least:

```text
Small mobile
Large mobile
Tablet
Desktop
Wide desktop
```

The invitation must be fully usable on:

- iPhone Safari
- Android Chrome
- Desktop Chrome
- Desktop Safari
- Edge

Important buttons should be thumb-friendly.

---

# 27. Accessibility

Minimum requirements:

- Semantic HTML.
- Keyboard navigation.
- Visible focus state.
- Accessible form labels.
- Alt text for meaningful images.
- Decorative images marked appropriately.
- Good text contrast.
- Reduced-motion support.
- No color-only instructions.
- RSVP forms usable with screen readers.
- Error messages associated with fields.

---

# 28. Recommended Tech Stack — Free-First

## Frontend / Full-stack framework

**Next.js + TypeScript**

Recommended because it can handle:

- invitation routes
- API routes / server endpoints
- server-side rendering where useful
- metadata/SEO
- admin interface
- static assets
- deployment to Vercel

## Hosting

**Vercel**

Use the free Hobby offering for a personal wedding project, while checking the current plan terms/limits before launch. Vercel's current terms describe Hobby as free for personal/non-commercial use. citeturn103023search9

## Database / Backend

**Supabase Free Plan**

Use:

- PostgreSQL
- Supabase Auth for admin users
- Row Level Security
- basic database storage

Supabase currently documents a Free Plan with two free projects. citeturn103023search7

## Maps

**Google Maps Embed**

Use the official embedded map for both venues. Google currently documents Maps Embed API usage as free with unlimited requests, while an API key is required. citeturn103023search0

## Music

**Spotify Embed**

Create the couple's playlist manually in Spotify and embed it in the website. Spotify officially supports playlist embeds. citeturn103023search1turn103023search3

## Email

For the zero-cost MVP, email is optional.

The RSVP dashboard can be the source of truth.

Optional future feature:

- transactional email provider with a free allowance
- or manual notifications to the couple

Do not make the wedding website dependent on email delivery for RSVP success.

---

# 29. Suggested Project Structure

```text
wedding-invitation/
│
├── app/
│   ├── page.tsx
│   ├── invite/
│   │   └── [token]/
│   │       └── page.tsx
│   │
│   ├── privacy/
│   │   └── page.tsx
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── invitations/
│   │   ├── rsvps/
│   │   ├── songs/
│   │   └── analytics/
│   │
│   └── api/
│       ├── invitation/
│       └── admin/
│
├── components/
│   ├── invitation/
│   │   ├── OpeningAnimation.tsx
│   │   ├── Hero.tsx
│   │   ├── Countdown.tsx
│   │   ├── Timeline.tsx
│   │   ├── LocationCard.tsx
│   │   ├── MapEmbed.tsx
│   │   ├── StaySection.tsx
│   │   ├── DressCode.tsx
│   │   ├── MusicSection.tsx
│   │   ├── GiftSection.tsx
│   │   ├── RSVPForm.tsx
│   │   └── ClosingMessage.tsx
│   │
│   └── admin/
│       ├── Dashboard.tsx
│       ├── InvitationTable.tsx
│       ├── RSVPTable.tsx
│       ├── SongRequestsTable.tsx
│       └── AnalyticsCards.tsx
│
├── lib/
│   ├── supabase/
│   ├── invitation.ts
│   ├── analytics.ts
│   ├── validation.ts
│   └── i18n.ts
│
├── locales/
│   ├── en/
│   ├── es/
│   ├── de/
│   └── hu/
│
├── public/
│   ├── images/
│   ├── orchids/
│   └── icons/
│
├── supabase/
│   └── migrations/
│
├── types/
│   └── database.ts
│
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

---

# 30. Environment Variables

Example:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=...

NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL=https://open.spotify.com/playlist/...

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_SERVICE_ROLE_KEY=...

ADMIN_EMAIL=...
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

---

# 31. RSVP UX Flow

```text
Open personalized URL
        ↓
Personalized greeting
        ↓
Browse invitation
        ↓
RSVP button
        ↓
Attendance question
        ↓
 ┌───────────────┐
 │ YES           │ NO
 └──────┬────────┘  │
        ↓            ↓
Guest count        Confirmation
        ↓
Dietary info
        ↓
Optional notes
        ↓
3 song requests
        ↓
Submit
        ↓
Confirmation screen
```

The system should save RSVP independently of song requests so that a song submission failure cannot destroy the attendance confirmation.

---

# 32. Invitation Open Tracking Flow

```text
Guest opens /invite/[token]
        ↓
Validate token
        ↓
Load invitation
        ↓
Record INVITE_OPENED event
        ↓
Set lightweight anonymous session identifier if needed
        ↓
Render personalized invitation
```

Avoid creating a persistent tracking profile unrelated to the invitation.

---

# 33. Admin Analytics Logic

Possible metrics:

```text
Total invitations
Unique invitations opened
Never opened
RSVP yes
RSVP no
Pending
Total expected guests
Confirmed guests
Song requests received
Most requested songs
```

Important distinction:

```text
Invitation count != guest count
```

One invitation may represent:

```text
Jonathan + Partner
```

Therefore both metrics should be tracked separately.

---

# 34. Guest Status Model

Each invitation should have one of:

```text
NOT_OPENED
OPENED_PENDING
CONFIRMED
DECLINED
REVOKED
```

The status can be derived from invitation event + RSVP state rather than duplicated everywhere.

Recommended UI labels:

```text
Not opened
Awaiting reply
Confirmed
Declined
Revoked
```

---

# 35. QR Code Support

Each invitation should have an optional QR code containing its private URL.

Use cases:

- Printed invitation backup.
- Save-to-phone card.
- Physical welcome materials.

Admin action:

```text
Generate QR
Download QR
Copy invitation link
```

The QR code should encode the opaque invitation URL, not private data directly.

---

# 36. SEO / Indexing

Because this is a private invitation system, avoid indexing personalized pages.

Recommended:

```text
<meta name="robots" content="noindex,nofollow" />
```

Use a generic public landing page only if desired.

Avoid exposing guest names in search-engine-visible pages.

---

# 37. PWA / Save to Phone

Optional enhancement:

```text
Add to Home Screen
```

The website can include:

- web app manifest
- app icons
- theme color
- service worker only if genuinely useful

Do not add a service worker simply for decoration if it introduces caching complexity.

---

# 38. Final Guest Experience

The ideal flow should feel like:

```text
A link arrives by WhatsApp/email.

↓

Guest opens it.

↓

A beautiful personalized invitation greets them by name.

↓

They see the date, ceremony and reception.

↓

They can see both locations and open navigation.

↓

They read accommodation and dress-code information.

↓

They listen to the couple's three selected songs.

↓

They RSVP.

↓

They submit up to three song requests.

↓

They receive an elegant confirmation.

↓

The couple sees the RSVP immediately in the admin dashboard.
```

---

# 39. Suggested Copy Tone

The overall tone should be:

**Elegant + intimate + playful + personal.**

Avoid:

- overly corporate language
- generic wedding-template clichés everywhere
- excessive emojis
- excessive animations
- too many paragraphs

Allow occasional humor, especially around:

```text
Please arrive 30 minutes earlier. PLEASE.

~5pm — until the body can stand it.

Another toaster would probably not be useful.
```

The humor should complement, not overpower, the elegant visual identity.

---

# 40. Suggested Final Sections Copy Structure

## Opening

```text
You are invited.

To celebrate love, friendship,
and one very important date.
```

## Date

```text
02.10.2027
Vienna, Austria
```

## Church

```text
The Ceremony
15:00

Please arrive by 14:30.
Seriously. Please.
```

## Reception

```text
The Celebration
~17:00 → late

Hetzendorf Palace

Until the body can stand it.
```

## Music

```text
Three songs we absolutely want to hear.

And now tell us yours.
```

## Gifts

```text
Your presence is enough.

But if you insist on bringing something,
we would rather turn it into future adventures
than another household object.
```

## RSVP

```text
Will you celebrate with us?

[ YES, I'M COMING ]
[ I CAN'T MAKE IT ]
```

---

# 41. Free-First Deployment Architecture

```text
                    ┌──────────────────────┐
                    │       Guest          │
                    │  Phone / Desktop     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │        Vercel        │
                    │      Next.js App     │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └─────────────┐
                 ▼                                ▼
        ┌─────────────────┐             ┌──────────────────┐
        │    Supabase     │             │ External embeds  │
        │ PostgreSQL/Auth │             │ Spotify + Maps   │
        └─────────────────┘             └──────────────────┘
```

For the MVP this architecture avoids running a dedicated server.

---

# 42. Cost Target

Target:

```text
Hosting                 €0
Database/Auth            €0
Maps embed               €0
Spotify embed            €0
Frontend framework       €0
UI library               €0
Icons                    €0
Analytics storage        €0

Target recurring cost:   €0
```

Possible future costs:

```text
Custom domain
Premium photography/assets
Transactional email
Additional database/hosting capacity
Paid fonts/assets
```

The exact free-plan quotas and terms should be rechecked immediately before launch because SaaS providers can change free-tier limits and eligibility.

---

# 43. Recommended Libraries

Use only free/open-source libraries where practical.

Suggested:

```text
Next.js
React
TypeScript
Tailwind CSS
Motion (`motion/react`)
GSAP (selectively)
Lucide React
Zod
React Hook Form
Supabase JS
next-intl or i18next
QRCode generation library
date-fns / Temporal-compatible date handling
```

Do not add a dependency unless it provides meaningful functionality.

---

# 44. Admin Authentication

Use Supabase Auth.

Recommended first implementation:

```text
Email + password
```

Optional later:

```text
Magic link
Passkey
Google login restricted to administrator accounts
```

Never build a custom password system unless there is a strong reason.

---

# 45. Content Management Strategy

Do not build a full CMS for the first version.

Use:

```text
Database configuration
+ translation files
+ admin invitation records
```

The couple should be able to edit guest-level content from the admin dashboard while global event information can initially remain in code/configuration.

Later, global settings can be migrated into the `site_settings` table without rewriting the invitation UI.

---

# 46. Testing Requirements

Minimum test coverage:

## Unit tests

- RSVP validation.
- Invitation token validation.
- Guest-count limits.
- Song-request limit of 3.
- Language fallback.
- Invitation status calculation.

## Integration tests

- Open invitation.
- Submit RSVP.
- Edit RSVP.
- Submit three songs.
- Reject fourth song request.
- Admin authentication.
- Admin invitation creation.

## End-to-end tests

At least one complete flow:

```text
Create invitation
→ Open personalized URL
→ Verify guest name
→ RSVP yes
→ Submit songs
→ Verify dashboard state
```

---

# 47. Performance Requirements

Target:

- Fast first load.
- Optimized WebP/AVIF imagery.
- Lazy-load noncritical images.
- Lazy-load Google Maps and Spotify embed when the relevant section becomes visible.
- Avoid shipping large animation libraries if a small CSS/React animation will do.
- Keep the hero lightweight.

The wedding invitation should still work comfortably on mobile networks.

---

# 48. Launch Checklist

## Content

- [ ] Couple names finalized.
- [ ] Three official songs selected.
- [ ] Gift details finalized.
- [ ] Contact details finalized.
- [ ] Four translations reviewed by humans.
- [ ] Dress code wording approved.
- [ ] Accommodation text approved.

## Technical

- [ ] Supabase project created.
- [ ] Database migrations applied.
- [ ] RLS policies tested.
- [ ] Admin authentication tested.
- [ ] Vercel deployment configured.
- [ ] Google Maps API key configured.
- [ ] Spotify playlist/embed configured.
- [ ] RSVP form tested.
- [ ] Personalized invitation tokens tested.
- [ ] Tracking tested.
- [ ] CSV export tested.
- [ ] Mobile testing completed.
- [ ] Reduced-motion mode tested.
- [ ] Privacy page added.
- [ ] `noindex,nofollow` verified for invitation pages.

## Guest testing

Before sending invitations to everyone, test at least:

```text
1 invitation in English
1 invitation in Spanish
1 invitation in German
1 invitation in Hungarian
1 invitation with plus-one
1 invitation with no plus-one
1 RSVP Yes
1 RSVP No
1 guest submitting 3 songs
1 attempt to submit 4 songs
```

---

# 49. MVP Scope vs Future Scope

## MVP — Build first

```text
Personalized invitation URLs
Guest-name opening animation
Four languages
Wedding details
Two locations
Google Maps links/embed
Countdown
Accommodation information
Dress code
Gift information
Spotify playlist embed
RSVP
Up to 3 song requests
Admin dashboard
Invitation tracking
CSV export
Supabase database
Vercel deployment
Privacy page
```

## Phase 2 — Optional

```text
Spotify account integration
Automated confirmation emails
WhatsApp share button
Calendar event generation
ICS download
QR invitation generator
Photo gallery
Guestbook
Realtime slideshow
Travel recommendations
Weather widget
Seating plan
Dietary dashboard
Custom invitation PDF generation
```

---

# 50. Recommended Implementation Order

```text
Phase 1
Project setup + design system

Phase 2
Invitation page + responsive layout

Phase 3
Personalized token system

Phase 4
Supabase schema + RLS

Phase 5
RSVP flow

Phase 6
Invitation analytics

Phase 7
Song requests + Spotify embed

Phase 8
Admin dashboard

Phase 9
Translations

Phase 10
Maps + accommodation + final content

Phase 11
Security + privacy + performance

Phase 12
Cross-browser/mobile testing

Phase 13
Production deployment
```

---

# 51. Definition of Done

The project is complete when:

1. A guest can receive a private unique link.
2. Opening the link produces a personalized animation using the invited person's configured name.
3. The guest can switch between English, Spanish, German and Hungarian.
4. The guest can clearly see the date, church, ceremony time and required arrival time.
5. The guest can clearly see the reception venue and approximate start time.
6. Both venues provide navigation links and/or embedded maps.
7. Accommodation guidance is available without unnecessarily exposing private home information.
8. Dress code and gift guidance are easy to find.
9. The couple's three Spotify songs can be played through an official Spotify embed.
10. The guest can confirm or decline attendance.
11. The guest can submit up to three song requests.
12. The couple can see RSVP status in an authenticated admin dashboard.
13. The couple can see whether an invitation has been opened.
14. Guest data is protected and not enumerable.
15. The site is mobile-friendly.
16. The site works without a paid hosting subscription for the expected small wedding-invitation workload, subject to the providers' current free-plan terms and limits.
17. The project can be deployed directly from GitHub to Vercel.

---

# 52. Final Product Vision

The finished site should feel like:

> **A beautifully designed private digital wedding invitation with a personality.**
>
> It should open with the invited guest's name, tell the story of the day, make the logistics effortless, let guests participate through music and RSVP, and give the couple a simple private dashboard to manage everything.

The technical architecture should remain intentionally simple:

```text
Next.js
+ TypeScript
+ Tailwind
+ Supabase
+ Vercel
+ Google Maps Embed
+ Spotify Embed
```

No dedicated paid server should be necessary for the MVP.

---

# 53. External References

These references were checked while preparing the technical specification:

- Spotify Embeds documentation: https://developer.spotify.com/documentation/embeds
- Spotify embedding tutorial: https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed
- Google Maps Embed API usage and billing: https://developers.google.com/maps/documentation/embed/usage-and-billing
- Google Maps Embed API overview: https://developers.google.com/maps/documentation/embed/get-started
- Supabase pricing: https://supabase.com/pricing
- Supabase billing / Free Plan documentation: https://supabase.com/docs/guides/platform/billing-on-supabase
- Vercel Terms / Hobby Plan: https://vercel.com/legal/terms

## Important

The website specification intentionally separates:

- **guest-facing invitation functionality**
- **private administration**
- **analytics/operational tracking**
- **music participation**

This keeps the first version simple enough to build entirely around free services while leaving clear extension points for future features.
