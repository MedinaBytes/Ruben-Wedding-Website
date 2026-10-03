---
name: website-template
description: Builds a complete, production-ready single-page website template for a specific industry vertical. Triggers on phrases like "build template NNN", "create website for [industry]", "start the next template".
---

# Skill: Build one industry template

When triggered for a specific industry (e.g. "build template 001 - fine dining restaurant"):

## Step 0 — Queue and folder setup

- If no template number is named, read `PROGRESS.md` and select the first `📋 Queued` row. If any row is `⏳ In progress`, resume that one first.
- Read `PLAN.md` for the selected template's slug and design direction target.
- Ensure `templates/NNN-slug/` exists.
- Mark the row `⏳ In progress` in `PROGRESS.md` before creating full source files.
- Run `npm run sync` so `FOLLOW_LIST.md` and the root portfolio registry show the active item.

## Step 1 — Research
Switch to the `researcher` chatmode (or role-play the persona). Produce `templates/NNN-slug/RESEARCH.md`.
Wait for it to exist before proceeding.

## Step 2 — Design direction
Switch to `designer`. Produce `templates/NNN-slug/DESIGN.md`.
Confirm the color palette and font pairing do not duplicate any entry in `PROGRESS.md`.

## Step 3 — Copy
Switch to `copywriter`. Produce `templates/NNN-slug/COPY.md`.

## Step 4 — Build
Build the template under `templates/NNN-slug/`:

- `index.html` — semantic HTML5, all 10 required sections, OG + Twitter meta, JSON-LD structured data, inline SVG logo unique to this template
- `style.css` — implements DESIGN.md via CSS custom properties on `:root`, mobile-first responsive (320 / 480 / 768 / 1024 / 1280)
- `main.js` — IntersectionObserver reveals, mobile hamburger, smooth scroll, count-up on stats, sticky-nav scroll toggle
- `assets/` — any template-specific SVGs or images (inline SVG preferred)
- `README.md` — preview instructions and design summary

The template must be self-contained: opening `index.html` directly via `file://` must work
with no console errors and no missing assets. Inline (copy) any needed shared CSS/JS rather
than linking to `../../shared/` — keep each template a standalone folder.

## Step 5 — Review
Switch to `reviewer`. Run the full audit. Produce `templates/NNN-slug/REVIEW.md`.
If verdict is NEEDS REVISION, fix the issues, then update REVIEW.md to PASS.

## Step 6 — Mark complete
- Update root `PROGRESS.md`: change the row for this template to ✅ DONE with a one-line design summary.
- Run `npm run sync` to regenerate `FOLLOW_LIST.md` and `portfolio/templates-data.js`; the completed template card should now expose a live preview.
- Commit: `feat: complete template [NNN] - [industry name]`

## Sequential mode

When the user asks to keep going or build templates one by one, repeat Steps 0–6 for the first queued row in `PROGRESS.md`. Do not ask for a new template number each time. Complete and commit exactly one template before starting the next.

## Per-template completion checklist

- [ ] All 10 required sections present and populated
- [ ] No Lorem Ipsum anywhere (verified with `grep -ri "lorem"`)
- [ ] All images hand-picked Unsplash photo URLs (NOT the deprecated `source.unsplash.com`)
- [ ] Inline SVG logo unique to this template
- [ ] Animations: hero entrance, scroll reveal, count-up, nav scroll all functional
- [ ] Mobile responsive at 320px (hamburger works, no horizontal scroll)
- [ ] `prefers-reduced-motion` respected
- [ ] JSON-LD structured data present and validates
- [ ] Open Graph + Twitter Card meta tags present
- [ ] `reviewer` REVIEW.md verdict: PASS
- [ ] PROGRESS.md updated
- [ ] `npm run sync` regenerated `FOLLOW_LIST.md` and `portfolio/templates-data.js`
- [ ] Committed
