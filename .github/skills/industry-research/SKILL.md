---
name: industry-research
description: Research process for understanding an industry vertical before designing or writing copy. Triggers on "research industry [name]" or when starting any new template.
---

# Skill: Research an industry vertical

Used by the `researcher` chatmode. Output goes to `templates/NNN-slug/RESEARCH.md`.

## Inputs
- Industry name and slug (from `PLAN.md`)
- Design direction target (from `PLAN.md`)

## Process

### 1. Identify 5 reference sites
Search for current top-performing websites in the vertical. Prefer:
- Established brand with strong visual identity
- A new entrant doing something distinctive
- One known award winner (Awwwards, CSS Design Awards, FWA) if applicable
- One that exemplifies the conventional template (to identify what to differentiate from)
- One that breaks the conventional template (for inspiration)

For each, capture: URL, one-line positioning, the single strongest visual idea, copy tone.

### 2. Customer profile
- Primary demographic (age band, income, intent)
- What decision they're trying to make on this site
- Emotional state at the moment of visit (anxious, excited, urgent, curious)

### 3. Trust signals specific to the industry
Examples by vertical: Michelin stars, board certifications, BBB, years in business, member of trade body, celebrity clients, press features, awards, accreditations.

### 4. Terminology glossary
The industry-specific words that signal "this site was made by someone who actually knows the industry."

### 5. Pricing conventions
How prices are presented in this industry: per item, package, hourly, prix fixe, free quote, etc.

### 6. Differentiation opportunities
Concrete patterns most competitors use that we will deliberately avoid.

## Output structure

```markdown
# RESEARCH — <Industry>

## Overview
<2–3 sentences>

## Customer Profile
- Demographic: …
- Decision being made: …
- Emotional state: …

## Visual Conventions
<3–6 bullets on common patterns>

## Trust Signals & Authority
<3–6 bullets>

## Terminology Glossary
<8–15 industry-specific terms with one-line definitions>

## Pricing Patterns
<how prices are usually presented>

## 5 Reference Sites
1. **<Name>** — <url> — <one-line takeaway>
…

## Differentiation Opportunities
<3–5 concrete patterns we will avoid or invert>
```
