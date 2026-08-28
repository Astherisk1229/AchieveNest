---
name: saas-design
description: Comprehensive SaaS UI/UX design system skill for production-grade web applications. Covers design systems, typography scales, cohesive color palettes, layout constraints, component hierarchy, progressive disclosure, accessibility, and high-density dashboard optimization.
---

# SaaS UI/UX Design System Skill

This skill provides production-grade architectural and visual design guidelines for modern SaaS applications, administrative portals, and complex information systems.

---

## 1. Core Design Philosophy

- **Information Hierarchy First:** The interface must immediately communicate context, status, and required action without visual noise.
- **Calm, High-Utility Aesthetics:** Avoid decorative saturation, excessive borders, heavy shadows, and competing primary elements.
- **Scannable Information Layout:** Enable users to parse 80% of necessary operational context within the first 3–5 seconds of viewport scanning.
- **Progressive Disclosure:** Surface primary workflows and metrics directly; tuck secondary configuration, advanced filters, and destructive operations into contextual or progressive layers.

---

## 2. Layout & Density Guidelines

### Dashboard & Overview Screens
- **Compact Hero/Header:** Limit page-level headers to essential breadcrumbs, page title, current cycle/scope context, and single primary page-level CTA.
- **Metrics & KPI Hierarchy:**
  - Distinctly separate **actionable KPIs** (e.g., pending approvals, unassigned roles, error queues) from **passive informational metrics** (e.g., total enrolled counts, historical archives).
  - Use single-line summary strips or balanced stat grids (3–4 metrics max) rather than heavy boxed widgets.
- **Container Nesting Constraint:**
  - Max container depth: `Page View` -> `Section Container` -> `Content Row / Data Table`.
  - Avoid `Card inside Card inside Card` patterns.

### Table & Data Grids
- **Header Alignment:** Clear, muted column titles (12–14px, medium weight, sentence case).
- **Row Density:** 44–52px comfortable row height for desktop management tables.
- **Data Scannability:** Numeric columns right-aligned, text left-aligned, status badges centered/aligned consistently.
- **Secondary Actions:** Group non-primary row actions in a kebab/ellipsis dropdown menu to preserve horizontal table rhythm.

---

## 3. Typography & Micro-Hierarchy

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Page Title** | 24–28px | 600 / SemiBold | 1.2 | Main Page Title |
| **Section Heading** | 16–18px | 600 / SemiBold | 1.3 | Group/Section Headers |
| **Subheading / Card Title**| 14–15px | 600 / SemiBold | 1.4 | Module Titles, Filter Titles |
| **Body Text** | 14px | 400 / Regular | 1.5 | Standard copy, table data |
| **Secondary / Subtext** | 12–13px | 400 / Regular | 1.4 | Descriptive captions, timestamps |
| **Metadata / Badges** | 11–12px | 500 / Medium | 1.2 | Status pills, category chips |

*Rule:* Never render essential readable text below 12px. Eliminate excessive uppercase tracking (`uppercase tracking-wider`) on body and descriptive text.

---

## 4. Color Architecture & Semantic Restraint

- **Brand Anchor:** Use brand color (e.g., Institutional Green) with deliberate intentionality for active selection, primary call-to-actions, and key identity anchors.
- **Surface Elevation:**
  - Background: Clean neutral/off-white (`#F8FAFC` or `#F9FAFB` in light mode).
  - Surface: Pure white (`#FFFFFF`) with a subtle 1px border (`#E2E8F0` / `#E5E7EB`).
- **Semantic Status Palette:**
  - **Success / Verified:** Emerald / Green (`#059669` / `#10B981`)
  - **Warning / Action Needed:** Amber / Orange (`#D97706` / `#F59E0B`)
  - **Danger / Destructive:** Rose / Red (`#DC2626` / `#EF4444`)
  - **Info / Neutral:** Slate / Blue (`#475569` / `#2563EB`)
- **Restraint Rule:** Never present more than 2 high-contrast saturated colors in the same visual focal cluster.

---

## 5. Interaction Patterns & Progressive Disclosure

- **Button Hierarchy:**
  - **Primary:** Filled solid semantic/brand color (1 per view).
  - **Secondary:** Outlined / neutral surface with subtle border.
  - **Tertiary / Ghost:** Borderless text button with hover highlight.
  - **Destructive:** Red accent outline or solid red confirmation modal.
- **Filtering & Search:**
  - Combine Search input + Scope Dropdown + Reset in a single compact toolbar row above tables.
  - Show active filter count chips when filters deviate from defaults.

---

## 6. Accessibility & Invariant Gates

- **Contrast:** Minimum 4.5:1 contrast ratio for all text elements against their container background.
- **Focus Indicators:** Ensure prominent 2px focus ring (`focus:ring-2 focus:ring-offset-2`) for all interactive elements and keyboard navigation.
- **Dark Mode Support:** Invert surface palettes cleanly using balanced dark slate neutrals (`#0F172A`, `#1E293B`) without losing text legibility.
