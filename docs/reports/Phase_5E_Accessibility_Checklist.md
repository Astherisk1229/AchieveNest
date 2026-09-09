# Phase 5E — Accessibility and Responsiveness Checklist
## WCAG 2.1 AA Compliance, Keyboard Navigation, ARIA Attributes, and Mobile Viewports

**Domain:** UI Accessibility & Responsiveness  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:50:00 UTC+08:00  

---

## 1. WCAG 2.1 AA Compliance Checklist

- [x] **Color Contrast**: All text elements achieve $\ge 4.5:1$ contrast ratio against background (#16834a, #064e2b, #0f172a).
- [x] **No Color-Only Information**: Statuses utilize text badges and explicit icon glyphs (CheckCircle2, AlertCircle).
- [x] **Keyboard Navigable Accordions**: Section headers are native `<button>` elements with `aria-expanded` and visible `:focus-visible` rings.
- [x] **Screen Reader Support**: Tables include `<caption>`, `<th scope="col">`, and descriptive header labels.
- [x] **Touch Targets**: All interactive buttons, badges, and dropdown triggers have minimum $44 \times 44\text{ px}$ clickable area.
- [x] **Responsive Viewports**: Candidate grid smoothly collapses into stacked responsive cards on viewport widths $< 768\text{ px}$.
