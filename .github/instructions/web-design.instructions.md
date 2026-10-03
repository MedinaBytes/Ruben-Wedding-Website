---
applyTo: "app/**/*.{ts,tsx},components/**/*.{ts,tsx},**/*.css,**/*.scss"
---
# Wedding Web Design Review Rules

Use the existing `.github/skills/design-system`, `.github/skills/design-taste-frontend`, and `.github/skills/impeccable` skills when relevant.

For UI review, use the current Vercel Web Interface Guidelines skill when available. It covers keyboard access, visible focus, touch targets, focus management, input behavior and error UX. The public source is `https://github.com/vercel-labs/web-interface-guidelines`.

Review every interactive screen for:

- keyboard operation
- focus visibility
- semantic structure
- responsive layout
- 44px-ish mobile targets
- 16px form text on mobile
- clear error states
- sufficient contrast
- reduced motion
- no color-only communication
- no accidental content overflow
- safe-area behavior on mobile

The visual target is editorial wedding design, not dashboard UI. Avoid excessive cards, excessive borders, generic SaaS spacing, gratuitous rounded rectangles, and repetitive AI-generated section patterns.
