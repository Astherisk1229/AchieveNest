# PLAN 10 — Phase 3 Contrast & Fallback Behavior Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Contrast Calculation Algorithm

Foreground text and borders for college badges are dynamically determined using WCAG relative luminance:

```javascript
export function getContrastForeground(hexColor) {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.55 ? '#0F172A' : '#FFFFFF'
}
```

---

# 2. Badge Appearance Behavior Matrix

| Background Color Category | Example Hex | Text Foreground | Border Styling | Fallback Applied? |
|---|---|---|---|---|
| **Dark Theme Color** | `#371683` (CEAC Purple) | `#FFFFFF` (White) | Subtle 10% white border | No |
| **Medium Theme Color** | `#16834A` (NDMU Green) | `#FFFFFF` (White) | Subtle 10% white border | No |
| **Light Theme Color** | `#FACC15` (Bright Yellow) | `#0F172A` (Slate 900) | 20% dark border | No |
| **Missing / NULL Color** | `NULL` | `#FFFFFF` (White) | Default accent border | **Yes (`#16834A`)** |
| **Malformed Color String**| `INVALID` | `#FFFFFF` (White) | Default accent border | **Yes (`#16834A`)** |
