# Judgment Criteria Validation Verification

## Criteria Validation & Bounds Enforcement

Judgment criteria are subject to strict numeric validation and scale-specific maximum caps:

### 1. Administrators Scale
- **B.3 Conduct of Research**:
  - Allowed Range: `0.0` to `40.0`
  - Input `40.0` -> **Accepted**
  - Input `45.0` -> **Rejected**: `"Accepted points [45] exceeds maximum allowed [40] for criterion [B.3 Conduct of Research]."`
- **B.6 Creative Work**:
  - Allowed Range: `0.0` to `20.0`
  - Input `20.0` -> **Accepted**
  - Input `25.0` -> **Rejected**: `"Accepted points [25] exceeds maximum allowed [20] for criterion [B.6 Creative Work]."`

### 2. Non-Teaching Scale
- **B.5 Recognition / Meritorious Award**:
  - Allowed Range: `0.0` to `30.0`
  - Input `30.0` -> **Accepted**
  - Input `35.0` -> **Rejected**: `"Accepted points [35] exceeds maximum allowed [30] for criterion [B.5 Recognition / Meritorious Award]."`

### 3. Negative Value Rejection
- Any negative accepted points (e.g. `-5.0`) -> **Rejected**: `"Accepted points cannot be negative or invalid."`

### 4. Semantic Null vs Explicit Zero
- `accepted_points = null`: Remains unresolved (`awaiting_evaluator`), blocks result determination.
- `accepted_points = 0.0`: Explicitly accepted zero points, marked as `scored`, contributes `0.0` to total, and enables scoring completion.
