# Free Public Agent Skills and Reference Sources

Use these as supplemental specialist knowledge. They do not override the repository's own instructions or the wedding specification.

## 1. Vercel React Best Practices

Repository:
`https://github.com/vercel-labs/agent-skills`

Skill:
`vercel-react-best-practices`

Purpose:
React/Next.js performance, data fetching, bundle size, rendering and re-rendering guidance.

Install:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
```

The current published skill is MIT licensed and contains a structured set of React/Next.js performance rules. citeturn798108search10turn798108search0

## 2. Vercel Web Interface Guidelines

Repository:
`https://github.com/vercel-labs/web-interface-guidelines`

Purpose:
Accessibility and interface-quality review.

Install:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
```

Use it to audit keyboard access, focus rings, dialogs, touch targets, forms and error states. citeturn798108search1

## 3. Vercel composition patterns

Skill:
`vercel-composition-patterns`

Use when designing reusable React components and avoiding prop-heavy component APIs.

## 4. Vercel React View Transitions

Skill:
`vercel-react-view-transitions`

Use only where navigation/section transitions actually benefit from it. Do not add it simply because it is available.

These skills are published in the Vercel agent-skills collection. citeturn798108search6

## 5. Motion React skill

Official source:
`https://motion.dev`

Install:

```bash
npx skills add https://motion.dev --skill motion-react
```

Motion also provides a free/open-source agent skill and an installer that supports Copilot. `npx motion-ai` can install the Motion AI Kit; its free skill and documentation search are open source, while some example/source and audit capabilities are premium. Do not depend on paid Motion+ content for this project unless explicitly approved. citeturn113888search0turn113888search4

The official free Motion skill is particularly useful because it helps an agent choose between CSS and Motion and write correct exit, layout, gesture, spring, scroll and SVG animations. citeturn113888search4turn113888search6

## 6. GSAP

Use GSAP selectively for advanced choreography, particularly when a single timeline needs precise sequencing or complex SVG motion. GSAP is available through npm and its current docs show the core and publicly available plugins on npm. citeturn624460search0turn624460search1

Do not introduce premium/private examples or paid resources as project dependencies without explicit approval.

## Rule for all public skills

Public skill != permission to copy a design.

Use skills for:

- engineering patterns
- animation technique
- accessibility review
- performance review
- component architecture

Create the wedding's own art direction.
