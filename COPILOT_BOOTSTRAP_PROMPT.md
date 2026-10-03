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

Then inspect only the relevant parts of:

```text
Resources/Photos/
Resources/Previous-Wedding-Template/
the current app routes, components, tests, and deployment docs
```

Use the supplied previous project only to compare feature patterns. Do not copy its wedding content, visuals, assets, unsafe APIs, or implementation.

## Mission

Continue the existing wedding invitation app for 2 October 2027 in Vienna. Preserve working code and close verified gaps. The product includes:

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

## Working rules

- Follow `.github/copilot-instructions.md`, the wedding spec, and applicable path-specific instructions as the source of truth.
- Inspect the current owner and its tests before each change. Work on one verified gap at a time; do not rebuild working foundations or add status/checklist files that duplicate the canonical docs.
- Never invent couple details or expose source photos, guest data, invitation tokens, or secrets.
- Preserve the existing stack. Add dependencies or components only when they deliver a needed capability that existing code cannot provide.
- Validate each change with the narrowest relevant test, then run the required lint, typecheck, unit tests, and production build at the release gate.

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
