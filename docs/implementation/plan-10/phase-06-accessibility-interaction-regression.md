# PLAN 10 — Phase 6 Accessibility & Interaction Regression
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Accessible DOM & Reading Order

The visual layout matches the logical reading order across both desktop and mobile:
```text
1. Student Name & ID -> 2. Academic Program & College -> 3. Account Status -> 4. Row Actions
```

### Key Accessibility Verifications
1. **Interactive Target Sizing**:
   - Primary "View Details" button: `h-8` with minimum `44px` click boundary padding.
   - Overflow dropdown trigger: `h-8 w-8` with explicit `aria-label="More actions for {student.full_name}"`.
2. **Focus Visibility**:
   - Focus rings conform to NDMU theme palette (`focus:border-[#16834a]`, `focus:ring-2`).
3. **Screen Reader Announcement**:
   - Table headers clearly demarcated (`th`, `scope="col"`).
