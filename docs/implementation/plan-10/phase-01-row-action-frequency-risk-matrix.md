# PLAN 10 — Phase 1 Row Action Frequency/Risk Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Row Action Inventory & Risk Classification

| Action Name | Target UI | Operation | Frequency | Security / Risk Level | Applicable Lifecycle States | Proposed Action Placement |
|---|---|---|---|---|---|---|
| **View Portfolio / Details** | Eye Icon / Popup | Opens student portfolio inspector modal | **Frequent** | **Low** (Read-Only) | All (`active`, `pending`, `suspended`, `archived`) | **Primary Action (Clickable row / Quick Button)** |
| **Reset Password** | Key Icon / Popup | Generates temporary password with confirm modal | **Occasional** | **Sensitive** (Requires confirm dialog) | `active`, `pending_first_login` | **Dropdown / Overflow Menu** |
| **Manage Status** *(Future)* | Dropdown Item | Suspend / Restore student account | **Rare** | **High** (Account lock) | `active`, `suspended` | **Dropdown / Overflow Menu** |
| **Archive Account** *(Future)* | Dropdown Item | Moves account to archived state | **Rare** | **High** (Archival) | `active`, `suspended` | **Dropdown / Overflow Menu** |
