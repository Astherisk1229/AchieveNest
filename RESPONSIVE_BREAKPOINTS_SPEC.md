# AchieveNest System Responsive Breakpoints Specification

This document details the standard responsive design breakpoints and layout adaptation rules for the **AchieveNest** application ecosystem. The responsive system is anchored on the universally accepted **Tailwind CSS Breakpoint Standard** to ensure optimal readability, visual consistency, and seamless interface transitions across devices of all form factors.

---

## 1. Core Breakpoint Philosophy: Mobile-First Strategy

AchieveNest implements a **Mobile-First CSS Architecture**. Base styles target mobile viewports (< 640px) by default. Min-width `@media` queries incrementally enhance and expand layouts for larger screens:

```css
/* Mobile-First Base Styles (Under 640px) */
.container {
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Responsive Enhancements */
@media (min-width: 640px)  { /* 1. Small: Landscape phones / large mobile */ }
@media (min-width: 768px)  { /* 2. Medium: Tablets / iPads (CRITICAL BOUNDARY) */ }
@media (min-width: 1024px) { /* 3. Large: Laptops / Desktops (CRITICAL BOUNDARY) */ }
@media (min-width: 1280px) { /* 4. Extra Large: Desktop Workstations */ }
@media (min-width: 1536px) { /* 5. 2X Large: Large Monitors / Ultrawide */ }
```

---

## 2. The "Big 3" Core Breakpoints

When designing or refactoring application components, these **three primary numbers** drive all major structural transitions:

| Breakpoint | Target Screen Transition | Major UI Behavioral & Layout Changes |
| :--- | :--- | :--- |
| **`768px`** | **Mobile → Tablet** | • Mobile menu turns into a horizontal navbar.<br>• 1-column layouts switch to 2-columns.<br>• Touch-target paddings adjust for desktop/stylus precision. |
| **`1024px`** | **Tablet → Desktop** | • Sidebars expand into permanent visible menus.<br>• Grids expand to 3 or 4 columns.<br>• Complex table views reveal supplementary columns and inline quick actions. |
| **`1280px`** | **Desktop → Large Screen** | • Main content container caps its max-width (`1280px`) and centers on screen.<br>• Typography line-lengths are restricted to optimal readability ranges (60–75 characters per line). |

---

## 3. Comprehensive 5-Point Setup (Tailwind CSS Standard)

The system enforces a 5-tier responsive breakpoint scale:

```css
/* Mobile First Base Styles (under 640px) */
.container { width: 100%; }

/* 1. Small (Landscape phones / large mobile) */
@media (min-width: 640px) { ... }

/* 2. Medium (Tablets / iPads) — MOST CRITICAL */
@media (min-width: 768px) { ... }

/* 3. Large (Laptops / Small Desktops) — MOST CRITICAL */
@media (min-width: 1024px) { ... }

/* 4. Extra Large (Desktops) */
@media (min-width: 1280px) { ... }

/* 5. 2X Large (Large Monitors) */
@media (min-width: 1536px) { ... }
```

### Detailed Breakpoint Specifications

| Tier | Prefix | Min Width | Physical Hardware Reference | UI Behavior & Guidelines |
| :---: | :---: | :---: | :--- | :--- |
| **Small** | `sm:` | `640px` | Large portrait phones (e.g., iPhone Max), landscape mobile | Dual-action buttons align horizontally; modal dialogs set max-widths instead of full-screen mobile overlays. |
| **Medium** | `md:` | `768px` | iPad / Android tablet (Portrait mode) | **Universally accepted mobile-to-tablet boundary.** Mobile menu turns into a horizontal navbar; 1-column layouts switch to 2-columns. |
| **Large** | `lg:` | `1024px` | iPad (Landscape mode), iPad Pro, 13" Laptops / older MacBooks | **Universally accepted tablet-to-desktop boundary.** Sidebars expand into permanent visible menus; card grids expand to 3 or 4 columns. |
| **Extra Large** | `xl:` | `1280px` | Standard Desktop Workstations, 15"+ Laptops | Main content container caps its max-width (`1280px`) and centers on screen to preserve typographic line readability. |
| **2X Large** | `2xl:` | `1536px` | Large Monitors, 4K / Ultrawide Displays | Additional grid columns (up to 5 or 6 columns for portfolio grids); multi-pane dashboard widgets expand horizontally. |

---

## 4. Technical Rationale & Hardware Alignment

### Why these exact pixel numbers?

1. **`768px` (iPad Portrait Mode)**
   - **Physical Dimension:** 768px is the physical width of an iPad in portrait mode.
   - **UI Impact:** It is the universally accepted boundary between "mobile phone UI" and "tablet/desktop UI".

2. **`1024px` (iPad Landscape Mode & Compact Laptops)**
   - **Physical Dimension:** 1024px is the width of an iPad in landscape mode and smaller laptops (like older MacBooks).
   - **UI Impact:** Provides sufficient horizontal space for sidebars to expand into permanent visible menus alongside multi-column grid canvas areas.

3. **`1280px` (Standard Desktop Container Limit)**
   - **Physical Dimension:** 1280px is the standard width for modern desktop content containers.
   - **UI Impact:** Prevents text lines from becoming too wide and hard to read, capping max-width and centering content automatically on screen.

---

## 5. View Component Layout Rules for AchieveNest

To maintain visual UI consistency across all View components (`src/components/`, `src/pages/`):

### A. Navigation & Shell Layouts
- **`< 768px`**: Mobile bottom bar or slide-over drawer menu. Top bar displays hamburger menu trigger.
- **`>= 768px & < 1024px`**: Compact horizontal navbar or vertical icon rail.
- **`>= 1024px`**: Sidebars expand into permanent visible menus displaying icons, labels, and badges.

### B. Portfolio & Dashboard Grid Layouts
- **Mobile (`< 768px`)**: 1-column layouts stack content vertically (`grid-cols-1`).
- **Tablet (`768px - 1023px`)**: 1-column layouts switch to 2-columns (`grid-cols-2`).
- **Desktop (`1024px - 1279px`)**: Grids expand to 3 or 4 columns (`grid-cols-3` / `grid-cols-4`).
- **Large Desktop (`>= 1280px`)**: Main content container caps its max-width (`1280px`) and centers on screen (`max-w-7xl mx-auto`).

---

## 6. How to Preview Different Sizes Live (Chrome / Edge DevTools)

You can instantly preview how the system looks across all 5 standard responsive breakpoints right in your current browser using Chrome/Edge DevTools:

### Step-by-Step Preview Guide:

1. In your browser at `http://localhost:5173/personnel/portfolio`:
   - Press **`F12`** (or Right-Click → **Inspect**).
2. Press **`Ctrl` + `Shift` + `M`** (or click the **Device Toggle Icon** 📱 in the top-left corner of DevTools).
3. At the top responsive bar, enter these exact **`Width x Height`** (`number x number`) values into the input boxes:

| DevTools Input (`Width x Height`) | Breakpoint Tier | Target Screen Device | Major Layout & UI Behavior |
| :---: | :---: | :--- | :--- |
| **`375 x 667`** | **Base Mobile** | iPhone / Mobile Phone | • 1-column vertically stacked card profile<br>• Hamburger menu button (`≡`) in top header |
| **`640 x 800`** | **`sm`** | Large Phone / Landscape Mobile | • Dual-action buttons arrange side-by-side<br>• Card containers expand width with comfortable padding |
| **`768 x 1024`** | **`md`** | **iPad / Tablet (Portrait)** | • **1-column stack switches into 2-column flex/grid**<br>• Filter tabs & stats expand horizontally |
| **`1024 x 768`** | **`lg`** | **Laptop / iPad (Landscape)** | • **Sidebar unfolds into permanent fixed left menu**<br>• Dashboard card grids expand to **3 or 4 columns** |
| **`1280 x 800`** | **`xl`** | **Desktop Workstation** | • Main content container caps max-width at **`1280px`** and centers on screen (`mx-auto`) |
| **`1536 x 900`** | **`2xl`** | **Large Monitor / 4K Display** | • High-density multi-pane dashboard display centered on screen |


