# Copilot Agent Bootstrap Prompt — Ruben Wedding Website

Paste this into GitHub Copilot Agent after adding this pack to the repository.

---

Act as the lead engineer + art director for this repository.

This repository already contains previous wedding templates and several `.github/skills/` folders. Those are context and inspiration, not the final specification.

First read:

```text
.github/copilot-instructions.md
wedding_invitation_website_spec.md
.github/skills/design-system/SKILL.md
.github/skills/design-taste-frontend/SKILL.md
.github/skills/impeccable/SKILL.md
.github/skills/redesign-existing-projects/SKILL.md
.github/skills/next-template-selector/SKILL.md
.github/skills/website-template/SKILL.md
```

Then inspect:

```text
Resources/Photos/
Templates previously designed/wedding-classic/
Templates previously designed/wedding-deco/
Templates previously designed/wedding-garden/
Templates previously designed/wedding-modern/
Templates previously designed/wedding-rustic/
```

Read only as much of the previous projects as needed to identify reusable engineering/design patterns. Do NOT copy their visual identity or implementation wholesale.

## Mission

Build a new premium wedding invitation site for 2 October 2027 in Vienna with:

- personalized invitation URL
- personalized animated intro with guest name
- EN / ES / DE / HU
- ceremony + reception information
- maps/navigation
- accommodation guidance
- cocktail dress code
- tasteful monetary-gift message
- guest RSVP
- up to 3 song requests
- optional final Spotify playlist embed
- privacy-conscious invitation open/interaction tracking
- organizer/admin view
- excellent mobile UX
- premium, bespoke animation
- optimized couple photography

## Before implementation

Do NOT immediately start writing the hero page.

First:

1. inspect package.json and existing stack
2. identify whether Next.js App Router is already present
3. identify existing component/system conventions
4. inspect the current skills
5. inspect previous wedding projects for patterns only
6. audit `Resources/Photos/`
7. choose a source-image manifest strategy
8. create an implementation checklist
9. identify missing configuration values
10. decide which free public skills are worth installing

Then execute the plan in phases.

## Required first phases

### Phase 1 — Foundation

Set up or adapt:

- routing
- design tokens
- typography
- i18n foundation
- component architecture
- environment variable conventions
- Supabase server/client boundaries
- privacy/noindex behavior

### Phase 2 — Image pipeline

Create an idempotent `npm run optimize:images` command using Sharp.

Read from `Resources/Photos/`.

Generate responsive AVIF/WebP derivatives and a manifest.

Never modify source files.

Do not place originals under `public/`.

Verify generated file sizes and dimensions.

### Phase 3 — Visual system

Create the strawberry-matcha + orchid design system from scratch.

Use previous templates only to identify what patterns are worth keeping.

Build the page so the real photos, typography and botanical elements are clearly authored for this wedding.

### Phase 4 — Premium motion

Use the official free Motion skill when available. Use Motion as default and GSAP only for genuinely complex sequences.

Do NOT create a generic collection of AI fade-ins.

Create a small motion language with:

- intro choreography
- editorial photo reveals
- orchid SVG path drawing
- timeline reveal
- subtle section transitions
- RSVP success animation

Every scene must support reduced motion.

### Phase 5 — Wedding content

Implement the content from `wedding_invitation_website_spec.md` exactly unless the user's later instruction changes it.

Never invent names, exact playlist songs, hotel recommendations, dress wording, or missing details.

### Phase 6 — Data and RSVP

Implement server-validated RSVP and song request flows.

Use opaque invitation tokens.

Use Supabase RLS/server authorization.

Do not expose service-role secrets.

### Phase 7 — Tracking

Track invitation interaction minimally.

Distinguish a raw request from an actual client-side visit/interacted event because link previews can prefetch invitation URLs.

Do not fingerprint users.

Do not send private guest information to third-party analytics.

### Phase 8 — Integrations

Lazy-load maps and Spotify embeds.

For maps, use Google Maps Embed if configured and provide direct navigation links as fallback.

Never autoplay audio.

### Phase 9 — QA

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also perform a responsive/accessibility/motion review.

## Important design rule

The final site must not look like `wedding-classic`, `wedding-deco`, `wedding-garden`, `wedding-modern`, or `wedding-rustic` with new colors. Those folders are references only.

The visual identity must be original to this wedding and built around the couple's photography and orchids.

## Deliverable discipline

After each phase report:

- files changed
- implementation completed
- tests/checks run
- performance issues
- accessibility issues
- security/privacy issues
- remaining TODO values

Then continue to the next phase unless a real blocker exists.
