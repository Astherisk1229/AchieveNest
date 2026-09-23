# OSAD Responsive Navigation & Accessibility Contract — Final Reference
## AchieveNest Plan 06: Final Responsive & Accessibility Contract

---

## 1. Breakpoint Invariants & Navigation Modes

| Mode | Breakpoint | Presentation | Behavior |
| :--- | :--- | :--- | :--- |
| **Desktop Expanded** | `>= 1024px` (`lg:`) | Permanent left sidebar (256px) | Sticky alongside independent scrollable workspace |
| **Desktop Collapsed** | `>= 1024px` (`lg:`) | Collapsed via Topbar toggle (`lg:hidden`) | Expands/collapses with `aria-expanded` toggle |
| **Tablet** | `640px - 1023px` (`sm:`/`md:`) | Off-canvas drawer | Slides over content with dark backdrop overlay |
| **Mobile** | `< 640px` | Off-canvas drawer | Slides over content, includes close button (`X`), auto-closes on nav |

---

## 2. Accessibility & Screen Reader Standards

- **Semantic Landmarks**: Uses `<header>`, `<aside aria-label="Sidebar Navigation">`, `<nav aria-label="Main Navigation">`, `<main>`, and `<footer aria-label="Portal Footer">`.
- **Single `<h1>` Rule**: Every page renders exactly one top-level semantic `<h1>` in `OSADPageHeader.jsx`.
- **Active Route Announcement**: Active navigation link carries `aria-current="page"`.
- **Keyboard Navigation**:
  - `Tab` and `Shift+Tab` navigate all controls sequentially.
  - `Escape` dismisses the mobile drawer.
  - `Enter` / `Space` activates links and buttons.
- **Touch Target Dimensions**: Minimum **44px** height and width (`min-h-[44px]`).
- **Zero Raw Errors**: Internal SQL errors, stack traces, and local filesystem paths are completely shielded from end-user UI.
