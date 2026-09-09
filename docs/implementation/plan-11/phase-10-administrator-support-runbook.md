# PLAN 11 — Phase 10 Administrator/Support Runbook
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Administrator & Support Diagnostics

### 1.1 Desktop Sidebar Disappears
1. Verify viewport width is `>= 1024px`.
2. Confirm `lg:static lg:translate-x-0` is present on `#main-sidebar`.
3. Confirm `mobileOpen` is not conflated with desktop rendering.

### 1.2 Mobile Drawer Does Not Close
1. Verify viewport width is `< 1024px`.
2. Confirm `onCloseMobile` callback executes upon navigation.
3. Confirm `mobileOpen` transitions to `false`.

### 1.3 Active Route Highlight Mismatch
1. Check `location.pathname` and `useSearchParams().get('tab')`.
2. Verify tab aliases in `Sidebar.jsx::isTabOrPathActive`.
3. Do not set active state manually in local storage or component state.

### 1.4 Role Switch Navigation Discrepancies
1. Verify `userSession` active role context and assigned roles.
2. Confirm `getAuthorizedNavigationForSession(userSession)` re-evaluates without browser refresh.
