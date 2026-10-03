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

## Implementation Status (2026-10-03)

### Completed in this phase

- Replaced the privacy-page preparation placeholder with a structured notice covering collected RSVP/song/event data, purpose and access, service providers, retention, contact, and the need for legal review. Contact details and the retention period remain explicit launch TODOs.
- Styled the privacy page to match the existing design tokens and removed redundant small section labels to give the invitation a less repetitive reading rhythm.
- Fixed the missing `admin` translation namespace that caused `/admin` to render literal keys such as `admin.loginTitle`. All four locale files now include the namespace; non-English copy is listed for fluent review.
- Added an admin-only wedding-data deletion control. It requires an allowlisted authenticated admin and the exact phrase `DELETE WEDDING DATA`; its SQL function deletes invitation-related records and stored site settings atomically, while preserving administrator accounts and deployment configuration.
- Confirmed the three-song limit is enforced by both API validation and database slot constraints. Confirmed `/i/*` and `/admin/*` have `noindex,nofollow` metadata and `X-Robots-Tag` headers.
- The orchid branch is project-authored artwork; its status is documented in `docs/ASSET_LICENSES.md`.

### Verification completed

- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass. Vitest reports 4 files and 11 tests passing.
- Image optimization completed for 8 curated photos from 35 private source photos.
- The local browser confirmed that the privacy route renders its full notice and `/admin` displays the translated sign-in form.
- `npm run test:e2e` passes all 4 Chromium smoke tests against the production build on an isolated port: homepage, invalid-token 404, Spanish locale switch, and admin sign-in/noindex. The Chromium runtime is installed locally.
- The shared port-3000 development process emitted repeated HMR WebSocket handshake errors. The production E2E run bypassed that process; restart the dev server if hot reload or client interactions appear stale there.
- The deletion action has not been executed against a database. Its migration must be applied and tested with disposable data in a non-production Supabase environment before enabling production use.

### Remaining launch work

- Configure the real Supabase URL, server-only service-role key, admin allowlist, and Supabase Auth admin accounts; apply and verify all migrations.
- Validate invitation creation/import, valid-token guest flow, RSVP edits, guest limits, song requests, dashboard metrics, and the deletion action end-to-end using fake test data. The real guest list must remain in the gitignored private CSV and must never enter tests or documentation.
- Keep the Playwright Chromium runtime installed in local/CI environments and expand browser coverage to RSVP, song requests, intro skip, reduced motion, and responsive sizes. The current smoke suite does not cover those full guest flows.
- Replace the privacy contact placeholder and decide retention/deletion timing; review the notice legally and verify service-provider wording against the deployment configuration.
- Have fluent speakers review Spanish, German, and Hungarian copy, including the new privacy and admin strings.
- Confirm the couple's three song titles, playlist URL, and gift details. Do not invent these values.
- Complete visual and accessibility review across the required viewport sizes and confirm the production map/playlist configuration. Current build success does not by itself establish product readiness.

`Resources/Previous-Wedding-Template/` remains reference material only. Reuse interaction lessons where helpful, but do not copy its visual identity, assets, or implementation.
