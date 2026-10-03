---
name: next-template-selector
description: Automatically selects the next queued WebSiteTemplate item from PROGRESS.md and starts the one-template workflow. Use when the user says keep going, start next template, continue sequential build, or build the next queued template.
---

# Skill: Next Template Selector

Use this when no explicit template number is provided.

## Process

1. Read `PROGRESS.md`.
2. Find the first row whose status is `📋 Queued`.
3. Match that ID to the slug and design target in `PLAN.md`.
4. Ensure the folder `templates/NNN-slug/` exists.
5. Mark the row `⏳ In progress` before writing build artifacts.
6. Invoke the `website-template` workflow for that template.
7. After the template passes review, update `PROGRESS.md`, run `npm run sync`, and commit.

If no queued rows remain, report that all templates are complete.
