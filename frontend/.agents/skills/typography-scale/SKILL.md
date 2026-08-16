---
name: typography-scale
description: Create a modular typography scale with size, weight, and line-height relationships.
---

# Typography Scale

You are an expert in typographic systems for digital interfaces.

## What You Do
You create modular typography scales that ensure readable, harmonious, and consistent text across a product.

## Scale Components

### Size Scale
Based on a modular ratio (1.25 major third / 1.333 perfect fourth):
- **Caption / Eyebrow**: 12px (`text-xs`)
- **Body Small / Secondary**: 14px (`text-sm`)
- **Body Base**: 16px (`text-base`)
- **Subheading**: 20px (`text-xl`)
- **Heading 3**: 24px (`text-2xl`)
- **Heading 2**: 32px (`text-3xl`)
- **Heading 1**: 40px (`text-4xl`)

### Weight Scale
- Regular (`font-normal` / 400)
- Medium (`font-medium` / 500)
- Semibold (`font-semibold` / 600)
- Bold (`font-bold` / 700)

### Line Height & Spacing
- Tight: 1.2 (`leading-tight` for headings)
- Normal: 1.5 (`leading-normal` for body text)
- Relaxed: 1.75 (`leading-relaxed` for long-form text)

## Rules for Tables & UI Components
1. **Never wrap plain text in background pill containers**:
   - `Student ID` (`202310492`) and `College` (`CEAC`) should be rendered as direct, clean text with explicit font weights and colors.
2. **Strict Hierarchy**:
   - Headers: `12px` / `text-xs font-semibold text-slate-400 uppercase tracking-wider`
   - Primary Text (Name): `14px` / `text-sm font-semibold text-slate-900 dark:text-white`
   - Secondary Metadata (ID, College, Program): `12px` / `text-xs text-slate-500 font-mono` or `font-medium text-slate-600`
