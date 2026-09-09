# AchieveNest Plan 08 — Legacy Data Decision Record
## 74 Legacy NULL Sex Records, No-Inference Enforcement & Gradual Edit Correction

---

## 1. Context & Baseline Audit

During the Plan 08 Phase 1 audit of all 79 Student profiles:
- **Female**: 3 records
- **Male**: 2 records
- **Prefer not to say**: 0 records
- **NULL**: 74 records
- **Invalid / Malformed text**: 0 records

---

## 2. Non-Negotiable No-Inference Policy

In strict accordance with Plan 08 Section 14:
- **Zero Inferred / Guessed Values**: Sex was **never** inferred from first names, surnames, honorifics, emails, profile photos, or program enrollment.
- **Zero Broad Default Overwrites**: No broad `UPDATE profiles SET sex = 'Prefer not to say' WHERE sex IS NULL` was executed.
- **Explicit Classification**: All 74 records are classified as **CLASS C (No Authoritative Source / Flagged for Administrative Review)**.

---

## 3. Edit & Correction Workflow

For the 74 legacy `NULL` Sex records:
1. **Reading / Display**: The user interface renders a neutral placeholder (e.g. `'Not yet provided'` or `'—'`), avoiding table breakage or runtime errors.
2. **Editing**: The edit modal presents an unselected `Select Sex` placeholder.
3. **Saving**: Saving without selecting a canonical Sex is rejected with a field-level validation error. The record transitions to a valid canonical state only when an authorized administrator or student explicitly selects a valid option backed by authoritative information.
