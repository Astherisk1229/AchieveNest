# PLAN 12 — Phase 4 Responsive Layout Verification
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Viewport Adaptation Specifications

1. **Desktop Viewport (`>= 1024px`)**:
   - Multi-column grid layout for Academic Information (2 columns).
   - Side-by-side Contact Cards for Program Coordinator and Organization Moderator.
   - Comfortable horizontal spacing with max width constraint (`max-w-4xl`).
2. **Tablet Viewport (`768px - 1023px`)**:
   - 2-column layout preserved for key field pairs.
   - Contact cards flex neatly with full text readability.
3. **Mobile Viewport (`< 768px`)**:
   - Single-column vertical stacking for Header, Academic fields, and Contact Cards.
   - Text wrapping for long names and institutional emails (`truncate` + responsive layout).
   - Zero horizontal scrollbar or overflow.
