# PLAN 11 — Phase 7 Mobile Drawer Focus Lifecycle
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Focus Management Lifecycle Across Drawer States

| State Event | Trigger Action | Focus Behavior | Document Scroll | Accessible Announcement |
|---|---|---|---|---|
| **Drawer Opens** | Topbar Hamburger Clicked | Focus enters navigation region | Main workspace dimmed | `aria-expanded="true"` announced |
| **Link Activated** | User taps destination link | Drawer closes; focus moves to route page | Restored | Target route rendered |
| **Drawer Dismissed** | User presses `Escape` | Drawer closes; focus returns to hamburger | Restored | `aria-expanded="false"` announced |
| **Backdrop Click**| User clicks dimmed overlay | Drawer closes; focus returns to hamburger | Restored | `aria-expanded="false"` announced |

---

# 2. Key Focus Invariant
- Closing the mobile off-canvas drawer never drops keyboard focus to `document.body`. Focus is returned to the triggering control or directed to the newly loaded route content container.
