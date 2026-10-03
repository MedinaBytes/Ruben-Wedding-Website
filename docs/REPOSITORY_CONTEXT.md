# Repository Context for the Wedding Invitation

## Existing folders

### `.github/skills/`

These are already present in the project and should be treated as specialized design/engineering knowledge. Read the relevant `SKILL.md` before asking Copilot to recreate an approach that may already be documented there.

- `design-system` — design-system decisions and consistency
- `design-taste-frontend` — frontend visual quality / taste
- `email-design-eng` — useful only when producing email-related invitation assets or notifications
- `impeccable` — visual/UX refinement and review
- `industry-research` — research workflows; do not use it to invent wedding facts
- `next-template-selector` — useful when selecting a starting architecture or template
- `redesign-existing-projects` — use when adapting an existing template/codebase
- `website-template` — use for generic website structure, never as the wedding's visual source of truth

### `Templates previously designed/`

These five projects are examples:

- `wedding-classic`
- `wedding-deco`
- `wedding-garden`
- `wedding-modern`
- `wedding-rustic`

They may be inspected to understand what has worked before. They are NOT the new site's design specification.

Copilot should compare them for reusable engineering ideas while deliberately creating a new visual system around:

- strawberry-matcha palette
- orchids
- the couple's real photography
- Vienna locations
- editorial/personal invitation feel
- personalized guest intro

### `Resources/Photos/`

This folder contains the couple's original website photography. It is private source material.

The runtime should consume optimized derivatives only. Do not make raw images public.

### `wedding_invitation_website_spec.md`

This is the primary product specification. It should remain the canonical place for content/feature requirements unless a later user instruction changes them.
