# Supplemental Agent Guidance

The canonical wedding project instructions are in [`.github/copilot-instructions.md`](../copilot-instructions.md), and the product specification is in `wedding_invitation_website_spec.md`. Follow those sources instead of maintaining a second copy of the same requirements here.

Path-specific guidance remains in the focused files in this directory: animation, assets, data/privacy, and web design.

---

## 0. Authority and precedence

1. The user's latest explicit instruction wins over everything below, except Sections 9 (security/privacy) and 13 (accessibility), which can only be relaxed if the user explicitly says so.
2. Then this file.
3. Then `wedding_invitation_website_spec.md`.
4. Then the files in `.github/skills/` and `.github/instructions/` (animation, assets, data-and-privacy, web-design).
5. `Templates previously designed/` is reference material only and has no authority.

Ignore any stray tool artifacts in the spec text (for example `citeturn...` strings). Never copy them into code, copy text or docs.

---

## 1. Frozen facts (single source of truth)

Store these in ONE typed config module (`lib/wedding-config.ts`). Never retype them elsewhere.

| Item | Value |
|---|---|
| Couple | Ruben David Quijada Sanchez and Andrea Müllauer |
| Display names | "Ruben & Andrea" (order as written; do not use nicknames such as "Andy" in public copy unless the couple confirms) |
| Date | Saturday, 2 October 2027 (`2027-10-02`) |
| Timezone | `Europe/Vienna` |
| Ceremony | Catholic Church of Altmannsdorf (St. Oswald) / Kath. Kirche St. Oswald, Khleslpl. 10, 1120 Wien, Austria |
| Ceremony time | 15:00 |
| Guest arrival | 14:30 ("Please arrive 30 minutes earlier. Seriously. Please.") |
| Reception | Hetzendorf Palace / Schloss Hetzendorf, Hetzendorfer Str. 79, 1120 Wien, Austria |
| Reception time | Right after the church, ~17:00, "until the body can stand it" |
| Dress code | Cocktail (formal welcome if guests want) |
| Palette | Strawberry-matcha with orchids |
| Languages | `en`, `es`, `de`, `hu` |
| Where to stay | Quiet residential area, very well connected by U6; offer recommendations on request |
| Gifts | Money preferred, tasteful tone, details hidden behind a button |
| Songs | Couple's 3 favorite songs (titles NOT provided yet) + up to 3 guest requests per invitation |

Countdown target is `2027-10-02T15:00` in `Europe/Vienna`, computed with timezone-aware logic (never browser-local).

---

## 2. Never invent

Never invent, guess or "fill in" any of the following. Use a clearly marked placeholder and add it to the TODO report instead:

- the couple's three songs, Spotify playlist URL
- gift/bank/payment details
- contact email or phone
- hotel or Airbnb recommendations
- the couple's home address (the spec says Sagedergasse 21A, but it is **private**: never in public HTML, metadata, translations shipped to the client, or logs)
- translations that you are not confident about: mark ES/DE/HU copy `// NEEDS HUMAN REVIEW` in a review list
- descriptions of photos you have not actually viewed
- domain names, API keys, Supabase project values
- the preferred language of any individual guest

---

## 3. Working method

1. Inspect before changing: `package.json`, existing stack, conventions, `.github/skills/*/SKILL.md`, then `Resources/Photos/`.
2. Read previous templates only for engineering patterns. Do not copy their visual identity or code wholesale. The result must not look like `wedding-classic/deco/garden/modern/rustic` with new colors.
3. Continue from the earliest incomplete phase. Never recreate working infrastructure.
4. Work in small, reviewable phases. After each phase, report: files changed, what was done, checks run (with real output), performance, accessibility and security/privacy issues, remaining TODO values.
5. Never claim something works unless you ran it. If you could not run it, say so.
6. Do not add a dependency unless it gives meaningful functionality. Justify each new dependency in one line.
7. No placeholder lorem ipsum, no dead code, no commented-out experiments in committed files.
8. Ask the user only when blocked by a missing value that cannot be placeholdered. Otherwise proceed.

---

## 4. Stack (fixed unless the user changes it)

Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Motion (`motion/react`) + Supabase (Postgres, Auth, RLS) + Zod + React Hook Form + i18n (next-intl or i18next) + Sharp for images + Vitest/Playwright for tests. Deploy target: Vercel Hobby. Recurring cost target: €0.

---

## 5. Design identity

- Original art direction: **Contemporary Botanical Minimalist** (see the `style` file): watercolor-style orchids, asymmetrical framing (one side or one corner, never a full border), generous negative space, tone-on-tone blush / mauve / matcha, thin gold or rose-gold geometric lines as accents.
- Typography: expressive script or calligraphy for the couple's names only; refined serif or geometric sans for everything else. Self-host fonts. Fallback stacks required.
- Start from the spec tokens (Strawberry `#E8A0A8 #F6CDD1 #FFF1F2`, Matcha `#A7B89B #C8D7BE #EEF3E9`, Neutrals `#FFFDFC #F7F4F0`, Text `#30312E`). Define them once as design tokens (CSS variables), never as scattered hex values.
- Editorial wedding feel, not a SaaS dashboard: avoid card-on-card layouts, heavy borders, generic rounded rectangles, repetitive section patterns.
- Tone of copy: elegant, intimate, playful, personal. Humor is allowed in these moments only: the 30-minutes-early line, "until the body can stand it", the gift section. No excess emojis.
- Real couple photography and orchid artwork must be visibly central. Orchid SVGs must be original or properly licensed; record licenses in `docs/ASSET_LICENSES.md`.

---

## 6. Motion

- Hierarchy: CSS first, then Motion for React, then GSAP only for complex timelines (justify in code comments and in the phase report).
- Required scenes: intro choreography (envelope/card, guest name, reveal), editorial photo reveals, orchid SVG path-drawing, timeline reveal, subtle section transitions, RSVP success bloom.
- Do not apply the same fade-up to every block. A small, consistent motion language: shared easing curves and duration tokens.
- Animate `transform` and `opacity` only on frequent animations. No permanent parallax, no heavy blur/backdrop-filter, no particle systems, no WebGL.
- Use `IntersectionObserver` or Motion viewport APIs, not scroll event loops.
- Intro MUST have a visible **Skip intro** control, and must not block content for returning visitors in the same session.
- `prefers-reduced-motion: reduce` → static presentation or simple fade. Every scene must support it. Clean up all listeners and timelines on unmount.
- Never autoplay audio.

---

## 7. Internationalization

- Locales: `en`, `es`, `de`, `hu`. All fixed copy lives in `/locales/<lang>/common.json`. No hardcoded user-facing strings in components.
- Language priority: invitation's stored language → guest's manual choice → browser language → `en`.
- Header language selector `EN | ES | DE | HU` always available. Switching language must preserve the token and any in-progress RSVP state.
- Use locale-aware date/time formatting. Hungarian and German date formats must be correct.
- Greeting is stored per invitation (`display_name` / greeting override), never derived from first/last name.

---

## 8. Images and assets

- `Resources/Photos/` is private source material. Never modify originals, never place them under `public/`, never expose them by URL.
- `npm run optimize:images` (Sharp) must be idempotent and deterministic: reads from `Resources/Photos/`, writes AVIF + WebP responsive derivatives and a manifest (role, width/height, focal point, file size, alt-text key). No upscaling. No EXIF/GPS in derivatives.
- Meaningful filenames (`couple-portrait-hero`, `couple-walking-vienna`, ...).
- Hero images must be lightweight. Lazy-load everything below the fold. Set explicit width/height to prevent layout shift.
- Optimize SVGs with SVGO. No embedded rasters in decorative SVGs.
- Fonts and critical assets are self-hosted; no production-critical dependency on random external hosts.

---

## 9. Security and privacy (non-negotiable)

- Invitation tokens: 32 bytes of cryptographically secure randomness, URL-safe, unguessable. Route: `/i/[token]` (or `/invite/[token]`). Never put names in URLs.
- All mutations validated server-side with Zod, regardless of client validation. RSVP and song endpoints are idempotent and rate-limited. Max 3 song slots enforced in the database (constraint) and the API.
- Supabase RLS on every table. Guests can only reach records tied to their own valid token, through server routes. Guests must never be able to enumerate invitations.
- `SUPABASE_SERVICE_ROLE_KEY` and any secret: server-only, never in client bundles, never in `NEXT_PUBLIC_*`, never committed. Provide `.env.example` with placeholders only.
- Admin routes require Supabase Auth plus an admin allowlist check on the server. No custom password system.
- Never log raw tokens, guest names, emails, or payment details.
- Pages under `/i/*`, `/invite/*` and `/admin/*` must send `noindex,nofollow` (meta and `X-Robots-Tag`). Guest names must not appear in `<title>`, metadata or Open Graph tags.
- Gift/payment details come from server-side config, returned only when `show_gift_details` is true, and are never hardcoded in the frontend.
- **Guest list is personal data.** The real guest list lives only in a gitignored file (`data/guests.private.csv`) consumed by a seed/import script. It is NEVER committed, NEVER embedded in source, tests, fixtures, docs or logs. Tests use fake names.
- Provide a `/privacy` page (data minimization, purpose, contact placeholder) and an admin "Delete wedding data" action. Flag that final legal wording needs human review before launch.

---

## 10. Tracking

- Track by invitation ID, never by IP, fingerprint or geolocation. No third-party analytics carrying names or tokens.
- A server request is NOT a "read". Link previews (WhatsApp, iMessage, etc.) prefetch URLs. Record `INVITE_OPENED` only from a client-side event after hydration (and a short dwell or interaction), and record raw server hits separately, if at all.
- Events: `INVITE_OPENED`, `RSVP_STARTED`, `RSVP_CONFIRMED`, `RSVP_DECLINED`, `LANGUAGE_CHANGED`, `SONG_REQUESTED`. Store invitation_id, session_id, event type, timestamp, locale only.
- Derive guest status (`NOT_OPENED`, `OPENED_PENDING`, `CONFIRMED`, `DECLINED`, `REVOKED`) from events plus RSVP state, not duplicated columns.
- Dashboard must keep **invitation count and guest count** as separate metrics and state each denominator.

---

## 11. RSVP and songs

- RSVP and song requests are saved **independently**: a song failure must never lose the RSVP.
- Guest name is never re-asked (known from the token). Max attendees comes from the invitation, never freely editable.
- Guests can edit their RSVP later via the same private URL.
- Yes / No confirmation states with distinct copy; success animation respects reduced motion.
- Song request fields: title, artist, optional Spotify URL, slot 1–3. A fourth song must be rejected with a clear message.
- Free-text songs for v1. No Spotify account integration.

---

## 12. Integrations

- Google Maps Embed loads lazily when the section nears the viewport and only if the key is configured. Always provide direct "Open in Google Maps" and "Get directions" links as the fallback, one per venue. Do not hardcode transit schedules.
- Spotify embed is lazy-loaded, user-initiated, never autoplay. If the playlist URL is missing, render a graceful placeholder, not a broken iframe.
- QR codes encode only the opaque invitation URL.

---

## 13. Accessibility and responsive quality

- Semantic HTML, full keyboard operation, visible focus, labelled form fields, errors associated with fields, screen-reader-usable RSVP.
- Contrast must meet WCAG AA. Never communicate by color alone (the arrival time and ceremony time are distinguished by label, icon and typography too).
- Mobile first: 44px-ish touch targets, 16px minimum form text, safe-area insets, no horizontal overflow. Verified on small mobile, large mobile, tablet, desktop, wide desktop.
- Decorative images use empty `alt` and `aria-hidden`; meaningful images use translated alt text keys.

---

## 14. Performance

- Fast first load on mobile networks. Lightweight hero. No large animation libraries beyond Motion unless justified.
- Lazy-load maps, Spotify, below-the-fold imagery. Use `next/image` or the manifest-driven responsive component.
- Report bundle impact of any motion or library addition.

---

## 15. Testing and definition of done

Required before any phase is called done:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Minimum tests: RSVP validation, token validation, guest-count limits, 3-song limit (and rejection of a 4th), language fallback, status derivation, countdown timezone logic. At least one end-to-end flow: create invitation → open URL → verify guest name → RSVP yes → submit songs → verify dashboard.

The project is done only when every item in Section 51 of the spec is true AND all rules above are satisfied.

---

## 16. Guest list handling

The couple provided a guest list (main list of 52 and an optional list of 30 from Andrea's side). Rules:

- Import via script from the gitignored private CSV only. Suggested columns: `display_name, greeting_override, language, max_guests, plus_one_allowed, side, tier, group_name`.
- `side`: `ruben` | `andrea`. `tier`: `main` | `optional`. The optional list is imported with status `draft`/inactive and must not be sent or exposed until the couple promotes it. Add these as an additive migration; do not alter the spec's core tables destructively.
- Entries written as "+1" (for example "Jacki +1") become `max_guests = 2`, `plus_one_allowed = true`.
- Do NOT deduplicate by name. Several first names repeat (for example Mario, Alex, Georg, Luis, Ricardo, Jacki, Susi); disambiguate with the group or last name when the couple provides it.
- Language per guest is unknown: leave empty (browser language fallback) and list in the report that the couple must assign `language` per guest.
- Never auto-generate or send invitations. The admin creates/copies links deliberately.

---

## 17. Forbidden behaviours (summary)

Do not: invent content, copy old templates, expose originals, commit the guest list, ship secrets, track by IP, mark an invite "read" from a server hit, autoplay audio, ship without a Skip-intro control, ignore reduced motion, skip the checks in Section 15, or report success you did not verify.
