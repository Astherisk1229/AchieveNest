# PLAN 11 — Phase 9 Desktop/Mobile Scenario Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Verification Matrix by Responsive Mode

| Mode & Viewport | Test Action | Expected Sidebar Outcome | Route Outcome | Result |
|---|---|---|---|---|
| **Desktop (`>= 1024px`)** | Click primary nav link | **Remains fully visible** (`lg:static lg:translate-x-0`) | Route updates | **PASS** |
| **Desktop (`>= 1024px`)** | Click active route | **Remains fully visible**; 0 state reset | Unchanged | **PASS** |
| **Desktop (`>= 1024px`)** | Press `Escape` key | **Remains fully visible**; ignores escape | Unchanged | **PASS** |
| **Desktop (`>= 1024px`)** | Switch role context | **Remains fully visible**; rebuilds menu | Redirects to default | **PASS** |
| **Mobile (`< 1024px`)** | Click primary nav link | **Drawer closes** (`-translate-x-full`) | Route updates | **PASS** |
| **Mobile (`< 1024px`)** | Click active route | **Drawer closes** | Unchanged | **PASS** |
| **Mobile (`< 1024px`)** | Click backdrop | **Drawer closes** | Unchanged | **PASS** |
| **Mobile (`< 1024px`)** | Press `Escape` key | **Drawer closes** | Unchanged | **PASS** |
| **Mobile (`< 1024px`)** | Click `X` close button| **Drawer closes** | Unchanged | **PASS** |
