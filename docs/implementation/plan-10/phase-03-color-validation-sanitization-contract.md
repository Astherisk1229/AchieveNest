# PLAN 10 — Phase 3 Color Validation & Sanitization Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Color Format Validation Standard

1. **Accepted Format**: Standard 7-character hexadecimal string `#RRGGBB` (case-insensitive).
2. **Server-Side Validation**: `ValidationHelper` / `CollegeModel` enforces regex `/^#[0-9A-Fa-f]{6}$/`.
3. **CSS Sanitization**:
   - Before applying color to inline styles, frontend verifies that the value matches valid hex regex.
   - Any malformed or script-injected string is stripped and replaced with fallback `#16834A`.

---

# 2. Sanitization Pipeline

```javascript
export function sanitizeCollegeBadgeColor(color) {
  if (!color || typeof color !== 'string') return '#16834A'
  const trimmed = color.trim().toUpperCase()
  const isValidHex = /^#[0-9A-F]{6}$/i.test(trimmed)
  return isValidHex ? trimmed : '#16834A'
}
```
