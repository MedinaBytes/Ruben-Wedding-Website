---
name: design-system
description: Shared design tokens, animation primitives, and component scaffolds available to every template. Reference this when starting a new template's stylesheet.
---

# Skill: Shared Design System

The `shared/` folder provides reusable primitives. Per the "self-contained template" rule,
each template **copies** what it needs from `shared/` into its own files rather than linking
to them — so the template folder remains portable as a standalone export.

## What's in shared/

### `shared/design-system/`
- `reset.css` — modern CSS reset
- `tokens.css` — documents the CSS custom property contract. Each template re-declares these on `:root` with its own values
- `animations.css` — keyframe library + `.reveal` baseline + `prefers-reduced-motion` override
- `components.css` — base scaffolds for `.btn`, `.container`, `.section`, `.card`

### `shared/js/`
- `scroll-animations.js` — IntersectionObserver reveal system + `countUp(el, target, duration)` utility
- `navigation.js` — sticky nav scroll-class toggle, mobile hamburger, smooth scroll, active section
- `utils.js` — `qs` / `qsa` / `debounce` / `prefersReducedMotion()` helpers

### `shared/assets/icons/`
Inline-ready SVG icons (phone, mail, location, clock, instagram, facebook, twitter-x, linkedin, menu, close, chevron-down, arrow-right). Copy markup directly into the template's HTML — don't reference via `<img src>` for icons.

## Token contract (overridden per template)

```css
:root {
  /* Color */
  --color-primary: …;
  --color-secondary: …;
  --color-accent: …;
  --color-surface: …;
  --color-background: …;
  --color-text: …;
  --color-text-muted: …;
  --color-border: …;

  /* Type */
  --font-display: …;
  --font-body: …;

  /* Type scale */
  --text-xs:  0.75rem;
  --text-sm:  0.875rem;
  --text-md:  1rem;
  --text-lg:  1.25rem;
  --text-xl:  1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.5rem;
  --text-4xl: 3.25rem;
  --text-5xl: 4.5rem;
  --text-6xl: 6rem;

  /* Spacing */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --space-32: 8rem;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.18);

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 200ms;
  --duration-base: 400ms;
  --duration-slow: 800ms;
}
```

## Animation baseline (required in every template)

- Hero: staggered fade-up entrance, 3 elements minimum, 100ms stagger
- Sections: `.reveal → .revealed` on IntersectionObserver intersection (threshold 0.15)
- Nav: transparent above 80px scroll, solid + shadow below
- Stats: count-up from 0 over ~1.6s when section enters viewport
- All animations gated behind `prefers-reduced-motion: no-preference` OR overridden in the reduce block
