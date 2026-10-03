# Ruben Wedding Website — Repository Instructions for GitHub Copilot

You are the principal engineer, product designer, animation director, and performance reviewer for this wedding invitation website.

## 0. Repository context — read this first

This repository already contains reusable context from previous websites. Preserve that context, but do NOT treat it as the specification for this wedding site.

Repository structure:

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
├── instructions/                 # add project-specific path rules here
└── prompts/                      # reusable project prompts
Resources/
└── Photos/                       # private original photos supplied by the couple
Templates previously designed/
├── wedding-classic/
├── wedding-deco/
├── wedding-garden/
├── wedding-modern/
└── wedding-rustic/
wedding_invitation_website_spec.md # primary product specification
```

The folders under `Templates previously designed/` are REFERENCE MATERIAL ONLY. You may inspect them for ideas such as layout patterns, component structure, spacing, typography choices, interaction patterns, or technical approaches. Do not copy a previous site's branding, exact visual composition, copy, data, assets, or component implementation verbatim. Do not make this website look like a recolored old template.

The existing `.github/skills/` directory contains project-relevant skills. Inspect applicable `SKILL.md` files before making major design, frontend, UX, template-selection, redesign, or research decisions. Prefer reusing a skill's principles over duplicating them in code.

`Resources/Photos/` is the source of truth for the couple's original photography. Treat it as private source material, not as a public web directory.

## 1. Source of truth and precedence

Follow this order when making decisions:

1. The user's latest request.
2. `wedding_invitation_website_spec.md`.
3. These repository instructions.
4. Path-specific instructions in `.github/instructions/`.
5. Existing local skills under `.github/skills/`.
6. Previous website templates as inspiration only.
7. Generic framework defaults.

When two sources conflict, use the higher item in the list and document the decision briefly.

## 2. Core product goal

Build a premium, personal digital wedding invitation for 2 October 2027 in Vienna. It must feel art-directed and intimate, not like a generic AI-generated wedding landing page.

Visual direction:

- Strawberry + matcha / muted sage palette.
- Orchids and refined botanical linework.
- Editorial serif + modern sans-serif typography.
- Romantic, elegant, contemporary, slightly playful.
- Real couple photography is the visual hero.
- Generous whitespace and calm composition.
- Animation should support emotion, hierarchy, and storytelling.
- Never communicate essential information through color alone.

## 3. Technical baseline

Before changing dependencies, inspect the existing `package.json` and application structure. If the project is empty, prefer:

- Next.js App Router
- TypeScript
- React
- CSS modules or a well-organized global CSS/token layer; Tailwind is acceptable if already present or clearly beneficial
- Motion (`motion/react`) for most React animation
- GSAP only when a timeline, SVG, or advanced sequencing materially benefits from it
- Supabase PostgreSQL for RSVP, invitation data, song requests, and first-party event records
- Static/build-time image derivatives generated with Sharp
- Vercel for deployment when compatible with the project's current plan

Do not introduce a large UI framework solely for this project. Prefer small, composable primitives.

Server Components are the default. Use Client Components only for interaction, animation, browser APIs, forms, or state that truly requires the client.

## 4. Existing skills + free public skills

Use the installed local skills first. In particular, inspect and apply relevant guidance from:

- `.github/skills/design-system`
- `.github/skills/design-taste-frontend`
- `.github/skills/impeccable`
- `.github/skills/redesign-existing-projects`
- `.github/skills/next-template-selector`
- `.github/skills/website-template`

Where useful, use current free public agent skills rather than inventing rules from memory. Approved public sources include:

### Vercel agent skills

- `vercel-react-best-practices`
- `web-design-guidelines`
- `vercel-composition-patterns`
- `vercel-react-view-transitions`

Source: `https://github.com/vercel-labs/agent-skills`

Example installation:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
```

Only install missing skills when they are genuinely useful; do not create duplicate local copies merely because a public skill exists.

### Motion public skill

Use the official Motion skill when implementing or reviewing animation:

```bash
npx skills add https://motion.dev --skill motion-react
```

or, when the full Motion AI Kit is appropriate for the environment:

```bash
npx motion-ai
```

Use only the free/open-source portions unless the user explicitly provides a paid subscription. Do not depend on Motion+ source or paid-only components.

## 5. Animation quality bar

The site's animation must NOT look like default AI-generated UI.

Avoid:

- random fade-in-up on every element
- excessive bounce
- generic page-load counters
- constant parallax everywhere
- animated gradients as decoration
- floating blobs with no semantic purpose
- excessive blur
- scroll hijacking
- autoplay audio synchronized to animation
- animations that block access to content

Instead, create a small visual motion language and use it consistently:

- soft editorial reveals
- masked image reveals
- botanical line/path drawing
- carefully timed stagger sequences
- subtle depth between photography and orchid framing
- deliberate section transitions
- restrained scale and opacity choreography
- spring motion only where physically or emotionally appropriate
- occasional cinematic timeline sequences for hero/intro scenes

Prefer transforms and opacity for high-frequency animation. Use `will-change` sparingly and only with evidence that it helps.

Every animation needs:

1. a reason to exist,
2. a defined duration/easing,
3. a reduced-motion fallback,
4. cleanup when the component unmounts,
5. a desktop and mobile behavior,
6. a performance check.

For complex sequences, centralize timing tokens rather than scattering magic numbers throughout components.

## 6. Suggested bespoke animation scenes

Adapt these to the final design rather than implementing blindly:

### Intro / personalized invitation

- Calm botanical background.
- Envelope/card enters with a physical paper-like reveal.
- Guest name appears with editorial typography.
- Orchid linework draws subtly around or behind the invitation.
- Main invitation unlocks into the first section.
- Provide `Skip intro` for returning visitors and accessibility.

### Hero

- Couple photograph reveals through a soft editorial mask.
- Couple names settle into place with restrained stagger.
- Small orchid detail moves only slightly, preferably via transform/opacity.

### Timeline

- Central/vertical line draws as the timeline enters the viewport.
- Milestones reveal sequentially without delaying interaction.

### Locations

- Address card enters before or with the map.
- Map iframe is lazy and can load after an explicit interaction/viewport reveal.
- Use subtle directional transition between ceremony and reception.

### RSVP success

Do not use generic confetti. Prefer a short celebratory orchid/petal or paper detail motion that is lightweight, tasteful, and optional under reduced motion.

## 7. Photography pipeline — mandatory

The folder `Resources/Photos/` contains the couple's original photos.

Rules:

- Never expose the source originals directly from a public URL.
- Never place raw source photos in `public/`.
- Never overwrite source files.
- Do not commit generated cache/output over source files.
- Generate optimized derivatives at build/dev time.
- Use AVIF and WebP where supported, with a safe fallback when appropriate.
- Generate responsive widths without upscaling.
- Strip EXIF/GPS metadata unless a specific image requires it.
- Generate LQIP/blur placeholders for important photos.
- Use intentional art-directed crops for hero and editorial sections.
- Maintain a manifest so components can request a named image rather than hardcoding arbitrary file paths.

Preferred source/output structure:

```text
Resources/
└── Photos/
    ├── originals/             # optional: raw source originals
    └── curated/               # optional: manually selected source set

public/
└── images/
    └── wedding/
        ├── *.avif
        ├── *.webp
        └── manifest.json
```

If the current folder does not use `originals/` and `curated/`, do not move files just to satisfy the example. Preserve the user's current organization and add only the minimum needed structure.

Create an idempotent script such as:

```bash
npm run optimize:images
```

Use `sharp` for build-time processing unless an existing project image pipeline is already superior.

Recommended derivative widths:

```text
320, 480, 640, 768, 960, 1280, 1536, 1920
```

Do not generate every size for every image if the source dimensions or actual design usage make that wasteful. Let the manifest record real variants.

For each important image, record:

- original dimensions
- derivative dimensions
- format
- file size
- crop/focal point if art-directed
- generated path
- alt text key

Performance target for the initial hero photography:

- choose the smallest derivative that still looks excellent on the target viewport
- aim for a few hundred KB rather than multi-megabyte originals
- never load desktop-sized images to mobile unnecessarily

## 8. Vectors and decorative artwork

Prefer custom lightweight SVGs for orchids and botanical decorations.

Use vectors for:

- orchid line art
- small floral ornaments
- decorative separators
- map/location icons
- music notation or tiny editorial details

SVG requirements:

- optimize with SVGO when appropriate
- avoid embedded raster data
- avoid giant path graphs when a simpler shape works
- preserve `viewBox`
- use `currentColor` for reusable monochrome icons where sensible
- expose meaningful accessible labels when SVGs are informative
- mark decorative SVGs `aria-hidden="true"`

For generic UI icons, a permissively licensed icon set such as Lucide/Tabler is preferred to downloading random SVGs from the web. For wedding-specific botanical artwork, custom or clearly licensed artwork is preferred.

Do not use a random online vector just because it says "free". Verify the license first and record it in `docs/ASSET_LICENSES.md`.

## 9. Music

The invitation must allow guests to submit up to three songs they would like to hear.

Free-first implementation:

- Store song requests in Supabase.
- Allow title + artist and optionally a Spotify/Apple Music URL.
- Do not require Spotify login for guests.
- Do not build Spotify OAuth just to receive recommendations.
- Show the final curated playlist using an official Spotify embed if the couple creates one.
- Lazy-load third-party embeds.
- Never autoplay music.
- Provide explicit play controls and visible mute/state behavior.

Optional future enhancement:

- organizer-side Spotify OAuth and playlist management, only if the user later decides the added integration complexity is worthwhile.

## 10. Maps and locations

Show both wedding locations clearly:

1. Catholic Church of Altmannsdorf (St. Oswald), Khleslpl. 10, 1120 Wien, Austria — ceremony 15:00; guests should arrive at 14:30.
2. Hetzendorf Palace (Schloss Hetzendorf), Hetzendorfer Str. 79, 1120 Wien, Austria — immediately after church; approximately 17:00 until the body can stand it.

Use an interactive Google Maps Embed iframe when configured. The Maps Embed API currently offers no-charge embed requests but still requires a Google Cloud API key/billing account configuration; restrict the key to the wedding domain. Provide direct Google Maps navigation links as the fallback. citeturn197617search0turn197617search4

Lazy-load the iframe or reveal it after the relevant section is near the viewport. Do not let third-party map JavaScript dominate the initial page load.

## 11. Accommodation

The couple's home location is useful for guest guidance, but it is private personal information.

Rules:

- Do not place the home address in public metadata, Open Graph, JSON-LD, sitemap, robots content, page source comments, analytics events, or public APIs.
- The accommodation section may display the location/address only to the invited guest within the authenticated/tokenized invitation flow if the product owner confirms this is desired.
- Keep public copy generic: the area is quiet/residential and well connected by U6; recommend looking around Sagedergasse/Meidling/nearby areas.
- Provide hotel/Airbnb recommendations only as curated external links or editable content.
- Never send the home address to an external analytics service.

## 12. Personal invitation security

Invitation URLs must use opaque, high-entropy random tokens.

Never expose sequential IDs such as `/invite/1`, `/invite/2`, etc.

Store a hash of the invitation token for lookup when practical, while only returning the minimum guest data needed by the page.

Apply:

- noindex/nofollow to invitation pages
- strict server-side validation
- rate limiting on RSVP endpoints
- server-side authorization for admin routes
- no Supabase service-role key in browser code
- no sensitive guest data in client-side analytics
- no raw invitation token in third-party URLs

Do not consider an invitation token a full security boundary if the invitation contains sensitive information. Keep especially sensitive information out of public page metadata and third-party requests.

## 13. RSVP data

At minimum store:

- invitation id
- RSVP status: pending / attending / not_attending
- guest display name
- response timestamp
- number of attendees, constrained by invitation allowance
- plus-one name if applicable
- dietary note if enabled
- optional message
- language

Validate all values server-side with a schema validator such as Zod.

Prevent duplicate submissions and make updates idempotent.

## 14. Guest tracking / analytics

The product needs to show which invited guest opened their invitation and who confirmed attendance.

Implement privacy-conscious first-party event records rather than invasive fingerprinting.

Track events such as:

- invite_viewed
- invite_interacted
- rsvp_submitted
- song_request_submitted
- language_changed
- map_opened
- playlist_opened

Important limitation: messaging apps and browsers can prefetch/link-preview URLs, so a raw HTTP request is NOT proof that a human opened the invitation. Distinguish `request_detected` from a client-side `invite_viewed`/`invite_interacted` event. Do not tell the admin that a guest definitely read the invitation based only on a server request.

Prefer:

- invitation id instead of raw token
- timestamps in Europe/Vienna context for display
- minimal metadata
- no IP storage unless legally reviewed and genuinely necessary
- no fingerprinting
- configurable retention/cleanup

## 15. GDPR / privacy

This website is for a wedding in Austria/EU. Keep the implementation privacy-minimal.

Provide a concise privacy page covering:

- what data is collected
- why it is collected
- who can access it
- retention period
- third-party services used
- contact details for the couple/organizer

Before adding non-essential analytics, advertising, tracking pixels, or marketing cookies, stop and document the consent/legal-basis requirement. Do not add marketing trackers simply because they are easy to install.

## 16. Accessibility

Target WCAG 2.2 AA-quality implementation.

Required:

- keyboard navigation
- visible `:focus-visible`
- semantic headings
- accessible dialog/focus management
- labels for every form field
- errors tied to fields
- sufficient text contrast
- 44px minimum touch targets where practical
- mobile form text at least 16px to avoid unwanted iOS zoom
- meaningful alt text for informational photos
- decorative images `alt=""`
- skip link
- `prefers-reduced-motion`
- intro skip control
- do not rely on color alone

## 17. Performance budget

Treat performance as part of the design, not a final cleanup task.

Targets on a representative mobile device / throttled connection:

- LCP: <= 2.5s target
- CLS: <= 0.1 target
- INP: <= 200ms target
- Initial JavaScript should be kept intentionally small.
- Avoid shipping animation libraries to pages/components that do not use them.
- Third-party iframes must not load during the first critical render unless necessary.
- Do not load all gallery images at once.
- Do not preload more than the genuinely critical hero resources.
- Fonts must be local/optimized when possible.

Use the Vercel React best-practice skill when reviewing data fetching, bundle size, waterfalls, rendering and re-rendering. The current public skill contains 70 rules across these categories. citeturn798108search10turn798108search11

## 18. Responsive behavior

Design mobile-first, but make desktop feel intentionally composed rather than simply stretched.

Test at minimum:

- 320px wide
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px
- 1920px

Test iOS Safari and Chromium-based mobile/desktop behavior, especially:

- viewport height changes
- sticky elements
- form inputs
- `100svh` / `100dvh`
- safe-area insets
- background images
- iframe resizing
- reduced motion

## 19. Design system

Create tokens for:

- strawberry tones
- matcha/sage tones
- cream/paper tones
- primary/secondary text
- borders
- spacing
- radius
- shadows
- typography scale
- animation durations
- easing curves

Do not hardcode dozens of unrelated values.

Colorblind-safe implementation is required: never encode meaning only through strawberry vs matcha. Pair color with text, icon, shape, or state.

## 20. Content quality

The tone may be elegant with a small amount of humor. Preserve personality in lines such as:

- "Please arrive 30 minutes earlier. PLEASE."
- "~5pm — until the body can stand it"

The gifts section should clearly but tastefully communicate that monetary gifts are preferred, avoiding awkward cliché wording. The final copy can be editable in translation files/content configuration.

Never invent missing wedding facts. Mark unknown values as TODOs.

## 21. Component architecture

Prefer a structure similar to:

```text
app/
├── page.tsx
├── i/[token]/page.tsx
├── admin/...
├── privacy/page.tsx
└── api/...

components/
├── invitation/
├── intro/
├── hero/
├── timeline/
├── locations/
├── accommodation/
├── music/
├── gifts/
├── rsvp/
├── gallery/
├── shared/
└── admin/

lib/
├── invitations/
├── rsvp/
├── songs/
├── analytics/
├── maps/
├── i18n/
├── images/
└── validation/

scripts/
└── optimize-images.*

public/images/wedding/

Resources/Photos/
```

Adapt to the existing project instead of forcing this exact tree.

## 22. Testing

Use the testing setup already present in the project. If none exists, prefer lightweight unit/integration tests plus Playwright for critical flows.

Critical end-to-end flows:

1. valid invitation URL -> personalized intro
2. invalid token -> safe not-found behavior
3. language switch preserves invitation token
4. RSVP attending
5. RSVP not attending
6. plus-one validation
7. song request with 1-3 songs
8. duplicate/rapid RSVP submission
9. admin can see invitation status
10. intro skip
11. reduced motion
12. responsive layout
13. map/playlist lazy loading
14. image pipeline output

Run, as applicable:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not claim success for a command that was not actually run.

## 23. Working method for Copilot Agent

Before large changes:

1. inspect repository tree
2. inspect `package.json`
3. inspect existing app/router structure
4. inspect all applicable `.github/skills/*/SKILL.md`
5. inspect the five `Templates previously designed/wedding-*` directories
6. inspect `Resources/Photos/` without modifying the originals
7. read `wedding_invitation_website_spec.md`
8. make an implementation checklist
9. identify which existing code can be reused safely
10. implement in small verifiable phases

After each phase:

- run relevant tests
- inspect the actual rendered result if browser tooling is available
- summarize changed files
- record any TODOs
- record performance/security/accessibility concerns

Do not stop at a plan when implementation is requested.

## 24. Definition of done

The implementation is not complete until:

- the personalized invitation flow works
- the four languages work
- RSVP works end-to-end
- song requests work
- locations/maps work
- the photo pipeline works from `Resources/Photos/`
- no source photo is publicly exposed
- the design is visually cohesive on mobile and desktop
- animation is bespoke and reduced-motion safe
- privacy/security requirements are implemented
- tests pass
- production build passes
- Lighthouse/Web Vitals issues discovered during review are addressed or documented
- the result does not look like any of the previous templates with a new color palette
