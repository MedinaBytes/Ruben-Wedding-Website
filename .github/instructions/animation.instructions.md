---
applyTo: "**/*.{ts,tsx,css,scss,svg}"
---
# Wedding Animation Rules

Use the official Motion guidance/skill when writing React animation. The free `motion-react` skill is available from `https://motion.dev`.

Animation hierarchy:

1. CSS transitions/animations for simple hover, color, opacity and small transforms.
2. Motion for React for component-level entrance, exit, layout, gesture and scroll-linked motion.
3. GSAP only for complex multi-step timelines, SVG path/morph choreography, or cases where its timeline model is materially better.

Every animation must have a clear design purpose. Avoid automatically applying the same fade-up animation to every section.

Prefer:
- transform + opacity
- compositor-friendly properties
- viewport-triggered reveals
- small stagger groups
- controlled timeline scenes
- custom easing curves with consistent motion tokens
- path-draw/reveal techniques for orchid linework

Avoid:
- layout-triggering animation at high frequency
- scroll event loops when `IntersectionObserver` or Motion APIs can do the job
- permanent parallax
- excessive backdrop-filter/blur
- huge particle systems
- continuous GPU-heavy effects
- unnecessary WebGL

Use `prefers-reduced-motion: reduce` and provide an immediate static presentation. Intro animations must have a visible Skip Intro control.

For animation reviews, check timing, easing, cleanup, bundle impact, mobile performance and reduced motion—not only whether the animation technically works.
