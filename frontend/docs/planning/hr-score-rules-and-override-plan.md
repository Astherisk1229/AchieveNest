# HR Manual Points and Score Override — Refined Implementation Plan

## Status

**Status:** Proposed  
**Module:** Portfolio Evaluation Studio  
**Policy source:** NDMU Rating Sheet for Ranking Specification  
**Risk level:** High — affects official totals, ranking, promotion, and audit history

## 1. Objective

Support the complete NDMU scoring rubric without turning every variable criterion into an unrestricted manual override.

The implementation must distinguish:

1. **Preset score** — a fixed official value selected from the rubric.
2. **Formula-derived score** — calculated from structured inputs such as units earned or years of service.
3. **Range-based rating** — an evaluator selects or enters a value within an officially permitted range.
4. **Authorized override** — an exceptional deviation from the rubric-derived value, requiring permission, reason, and audit metadata.

Every confirmed item must preserve how the awarded value was produced.

## 2. Current-State Findings

The current implementation has several correctness issues:

1. CriterionEvaluation stores the selected classification label, but currentAwardedPts is read from selectedEvidence. Changing the dropdown does not update the confirmed points.
2. Classification rules are embedded inside the React component instead of the scoring domain.
3. Ph.D. units earned and Master's units earned are formula-based, not discretionary custom scores.
4. Seminar points are fixed by scale: 3, 4, 6, 8, or 10.
5. Years of service is formula-based: one point per two years, maximum 10.
6. Area B contains range-based criteria, but each range still needs an official basis and allowed bounds.
7. The original plan states C.1 has a 20-point criterion cap; the specification defines C.1 at 30 points, with individual subcategories up to 20.
8. Area B criteria can reach 40 individually, while the entire Area B awarded total is capped at 50.
9. The current engine applies cumulative caps but the UI displays a generic 40-point maximum for every criterion.
10. parseFloat(value) || 0 incorrectly converts blank or invalid input into zero.
11. The proposed 0.5 increment and 7.5-point example are not established by the current official specification.
12. Remarks are not currently passed through onVerify or persisted in evidenceItems.
13. Audit logging only at finalization loses item-level decision context and cannot distinguish calculation from exception.

## 3. User Review Required

> [!IMPORTANT]
> Confirm these governance decisions before implementation:
>
> 1. **Decimal scores:** Recommended default is whole points only because the supplied specification defines integer values. Enable 0.5 increments only with written policy approval.
> 2. **Override permission:** Decide whether all HR evaluators or only HR Directors may make a true exception override.
> 3. **Range criteria:** Confirm the exact point matrix for B.1, B.2, B.3, B.6, C.1, and C.2 where the current specification gives ranges or maximums without a complete subscale.
> 4. **Override direction:** Decide whether authorized overrides may increase and decrease points or only reduce them.
> 5. **Reason policy:** Confirm required reason categories and minimum explanation length.
> 6. **Audit timing:** Recommended: record a decision event when an override is confirmed and reference it again at finalization.
> 7. **Post-finalization edits:** Decide whether finalized scores are immutable or require a formal reopen/amendment workflow.

Until these decisions are approved, implement presets and formula-derived scoring first and keep true override disabled.

## 4. Scoring Modes

### 4.1 Preset

Use when the official rubric defines a fixed value.

Examples:

- Ph.D. Degree Holder: 40;
- Master's Degree Holder: 20;
- Professional Organization Officer: 10;
- Professional Organization Member: 5;
- International Seminar: 10;
- National Seminar: 8;
- Regional Seminar: 6;
- City or Provincial Seminar: 4;
- In-House Seminar: 3.

The evaluator selects a rule. The system supplies the points.

### 4.2 Formula

Use when points follow a deterministic rule.

Examples:

- Ph.D. units: floor(units / 3) × 2, capped at 10;
- Master's units: floor(units / 3) × 1, capped at 10;
- years of service: floor(years / 2), capped at 10.

The evaluator enters or confirms the source quantity. The scoring engine calculates points. This is not an override and does not require override justification.

### 4.3 Range-Based Rating

Use when the approved rubric permits evaluator judgment within a defined range.

The UI must show:

- rule name;
- allowed minimum;
- allowed maximum;
- permitted increment;
- scoring guidance;
- awarded value;
- required normal evaluation remark if policy requires it.

Range entry is a normal rubric decision, not an override, when it stays within the approved rule.

### 4.4 Authorized Override

Use only when awarded points differ from the value produced by the selected preset, formula, or range rule.

Required:

- explicit score_override permission;
- original rule ID;
- calculated or default points;
- overridden points;
- direction and difference;
- reason category;
- meaningful justification;
- evaluator identity;
- timestamp;
- target and evidence IDs;
- confirmation.

The mode label should say Authorized Exception rather than Custom HR Point Input so ordinary range scoring is not confused with policy deviation.

## 5. Canonical Scoring Rule Registry

Move classification options and caps out of CriterionEvaluation.

Recommended file:

    src/models/NDMURatingRules.js

Each rule should define:

| Field | Purpose |
| :--- | :--- |
| id | Stable rule identity. |
| area | areaA, areaB, or areaC. |
| criterionKey | degrees, seminars, publications, and so on. |
| subcriterionKey | Optional official subcategory. |
| label | Human-readable rubric label. |
| inputType | PRESET, FORMULA, RANGE, or SYSTEM. |
| fixedPoints | Fixed preset value. |
| minPoints | Lowest allowed range value. |
| maxPoints | Per-item or subcriterion maximum. |
| increment | Permitted step. |
| criterionCap | Cumulative criterion cap. |
| areaCap | Cumulative area cap. |
| formula | Named calculation strategy when applicable. |
| guidance | Evaluator-facing rule explanation. |
| requiresRemark | Normal rubric remark requirement. |
| allowOverride | Whether an authorized exception is permitted. |

Do not store executable formula strings. Map named formula IDs to trusted functions.

NDMURatingEngine should import this registry so the UI and calculations use one source of truth.

## 6. Evidence Decision Data Model

Extend each evaluated evidence item with:

- scoringMode;
- ruleId;
- sourceInputs;
- calculatedPoints;
- awardedPoints;
- criterionCap;
- areaCap;
- isOverride;
- overrideReasonCode;
- overrideJustification;
- overrideBy;
- overrideAt;
- remarks;
- verificationStatus;
- decisionAt.

Keep calculatedPoints and awardedPoints separate.

Example:

    calculatedPoints: 6
    awardedPoints: 5
    isOverride: true
    overrideReasonCode: INSUFFICIENT_SCOPE_EVIDENCE

Never infer an override later by comparing only labels.

## 7. Validation and Cap Behavior

### Input Validation

Store numeric input as a string while editing.

Reject:

- blank input;
- non-numeric input;
- negative values;
- non-finite values;
- unsupported decimal increments;
- values outside the selected rule range;
- values above the item maximum;
- override without permission;
- override without reason and justification.

Do not silently turn blank input into zero.

### Per-Item and Criterion Caps

The UI must distinguish:

- selected rule maximum;
- per-item maximum;
- cumulative criterion cap;
- Area B section cap;
- Area A, Area C, and grand-total caps.

If an item value exceeds its allowed maximum:

- block confirmation;
- show the exact permitted range.

If valid items cause a cumulative cap to be reached:

- preserve raw verified points;
- show awarded capped points separately;
- explain how much is excluded by the cap;
- do not silently rewrite individual item decisions.

Example:

    Area B raw: 62
    Area B awarded: 50
    12 points excluded by the Area B cap

## 8. Criterion Evaluation UI

### Default Flow

1. Select evidence.
2. Select the applicable official rule.
3. Complete structured input when required.
4. Review calculated or permitted points.
5. Add normal remarks if required.
6. Confirm Item or Confirm Item and Next.

### Mode Presentation

Render the applicable rule input automatically:

- fixed preset selector;
- units field for formula rules;
- guided numeric field for approved ranges;
- read-only calculated tenure score;
- Authorized Exception action only when permission and rule allow it.

Avoid a global two-mode toggle that suggests every criterion accepts arbitrary values.

### Authorized Exception Panel

When opened:

- show official rule;
- show calculated/default points;
- show allowed cap;
- request exception points;
- request reason category;
- require justification;
- show the difference;
- require confirmation before applying.

Do not use emojis in the label.

### State Reset

When selectedEvidence changes:

- load that item's saved rule and decision state;
- otherwise initialize from its applicable default;
- clear errors;
- close any exception panel;
- do not carry points or remarks from the previous item.

## 9. Studio and Engine Integration

Update handlers to accept one decision object rather than positional arguments:

    onVerify(itemId, decision)
    onVerifyAndNext(itemId, decision)

Decision:

- ruleId;
- scoringMode;
- sourceInputs;
- calculatedPoints;
- awardedPoints;
- remarks;
- override metadata.

PortfolioEvaluationStudio should:

- validate through the scoring domain before updating evidenceItems;
- persist the complete decision object;
- recalculate using calculateNDMUScores;
- show raw and capped totals;
- preserve selected evidence;
- pass manual/range fields into draft recovery if that feature is enabled.

The scoring engine, not the React component, must be the final authority for rules and caps.

## 10. Authorization

Add an explicit capability:

    score_override

Do not infer permission from:

- display name;
- designation text;
- route;
- button visibility;
- client-side role label alone.

The controller must reject unauthorized overrides even if the UI is manipulated.

Because the current frontend is local-storage based, this is prototype enforcement only. A production system requires server-side authorization.

## 11. Audit Trail Integration

Recommended event codes:

- HR_SCORE_RULE_APPLIED;
- HR_SCORE_RANGE_ASSIGNED;
- HR_SCORE_OVERRIDE_APPLIED;
- HR_SCORE_OVERRIDE_CHANGED;
- HR_SCORE_OVERRIDE_REMOVED;
- HR_EVALUATION_FINALIZED_WITH_OVERRIDES.

For normal preset and formula decisions, detailed audit volume may be reduced according to governance policy.

For overrides, record:

- evaluator ID, name, and role;
- target Personnel ID and label;
- evaluation/submission ID;
- evidence ID;
- criterion and rule ID;
- calculated/default points;
- awarded points;
- reason code;
- safe justification;
- timestamp;
- related decision ID.

Do not include evidence documents, credentials, or sensitive unrelated remarks.

Audit when the override decision is confirmed, not on every keystroke.

At finalization:

- summarize active overrides;
- reference existing override decision IDs;
- do not duplicate unbounded free-text details.

If HRAuditEventRegistry does not yet exist in the codebase, add this work to the Audit Trail implementation dependency rather than marking it only VERIFY.

## 12. Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| NEW or MODIFY | src/models/NDMURatingRules.js | Central scoring-rule registry. |
| MODIFY | src/pages/hr-admin/evaluation-submissions/evaluation/rating/NDMURatingEngine.js | Calculate and validate preset, formula, range, raw, and capped scores. |
| MODIFY | src/pages/hr-admin/evaluation-submissions/studio/evaluation/CriterionEvaluation.jsx | Render rule-appropriate inputs and authorized-exception UI. |
| MODIFY | src/pages/hr-admin/evaluation-submissions/evaluation/PortfolioEvaluationStudio.jsx | Persist full decision objects and recalculate totals. |
| MODIFY | src/pages/hr-admin/evaluation-submissions/evaluation/actions/FinalizeVerificationModal.jsx | Display and acknowledge active overrides before finalization. |
| MODIFY | src/controllers/HRController.js or evaluation controller | Enforce override permission and persist decisions. |
| MODIFY | src/hooks/useHR.js or evaluation hook | Expose decision and finalization actions. |
| NEW or MODIFY | src/models/HRAuditEventRegistry.js | Register score decision and override events. |
| MODIFY | src/controllers/HRAuditTrailController.js or audit writer | Write structured override events. |
| VERIFY | draft recovery model and hook | Preserve unsaved range and override inputs safely. |
| VERIFY | NDMU_RATING_SHEET_FOR_RANKING_SPEC.md | Obtain missing approved range matrices and decimal policy. |

## 13. Implementation Phases

### Phase 0 — Policy Completion

- [ ] Confirm the seven user-review decisions.
- [ ] Obtain complete scoring matrices for under-specified ranges.
- [ ] Confirm decimal policy.
- [ ] Define score_override permission.
- [ ] Define reason categories and justification requirements.
- [ ] Define finalized-score amendment policy.

### Phase 1 — Rule Registry and Tests

- [ ] Move rule definitions out of CriterionEvaluation.
- [ ] Encode fixed presets.
- [ ] Implement units-earned formulas.
- [ ] Confirm tenure formula.
- [ ] Encode range bounds and increments only after approval.
- [ ] Add per-item, criterion, area, and grand-total caps.
- [ ] Add rule and formula tests.

### Phase 2 — Decision Model and Engine

- [ ] Define the complete evidence decision object.
- [ ] Separate calculated and awarded points.
- [ ] Add validation API.
- [ ] Preserve raw and capped totals.
- [ ] Add override detection and metadata validation.
- [ ] Add engine tests.

### Phase 3 — Criterion UI

- [ ] Fix preset selection so it updates points.
- [ ] Render structured formula inputs.
- [ ] Render guided range input.
- [ ] Add Authorized Exception panel.
- [ ] Require reason and justification.
- [ ] Reset state correctly between evidence items.
- [ ] Add accessible errors and focus behavior.

### Phase 4 — Studio Persistence and Drafts

- [ ] Change verification handlers to decision objects.
- [ ] Persist complete item decisions.
- [ ] Recalculate live totals.
- [ ] Show raw and capped values.
- [ ] Preserve range and exception work in evaluation draft recovery.
- [ ] Test Verify and Next.

### Phase 5 — Authorization and Audit

- [ ] Enforce score_override in controller.
- [ ] Register audit events.
- [ ] Record confirmed override decisions.
- [ ] Add override summary to finalization.
- [ ] Prevent finalized edits without approved amendment flow.

### Phase 6 — Verification

- [ ] Run production build.
- [ ] Run targeted lint.
- [ ] Run rule, engine, component, permission, and audit tests.
- [ ] Complete manual rubric and cap verification.

## 14. Automated Verification

Add tests for:

- every fixed preset;
- Ph.D. and Master's units formulas;
- tenure formula;
- range minimum, maximum, and increment;
- blank, negative, non-finite, and unsupported decimal values;
- per-item and cumulative criterion caps;
- Area B raw and 50-point awarded cap;
- Area A 70, Area C 40, and grand total 160 caps;
- preset selection updating awarded points;
- evidence state reset;
- authorized and unauthorized override;
- missing reason and justification;
- calculated versus awarded persistence;
- override audit payload;
- finalization with active overrides;
- failed finalization preserving decisions.

Run separately:

    npm run build
    npm run lint

The Vite build command does not run linting.

## 15. Manual Acceptance Tests

1. Select Ph.D. Degree Holder and confirm 40 points.
2. Enter 21 Ph.D. units and confirm the official formula result, capped as specified.
3. Select Regional Seminar and confirm 6 points without manual override.
4. Enter a permitted range-based B.1 score and confirm it is treated as normal rubric scoring.
5. Attempt a score outside the rule range and verify confirmation is blocked.
6. Enter a blank, negative, unsupported decimal, and non-numeric value.
7. Reach a cumulative criterion cap and verify raw versus awarded totals.
8. Reach Area B raw points above 50 and verify the awarded total remains 50.
9. Use Authorized Exception with permission and provide reason and justification.
10. Attempt Authorized Exception without permission.
11. Change evidence and verify previous points and remarks do not leak.
12. Refresh during an unfinished decision and verify draft recovery if enabled.
13. Finalize with overrides and verify the audit references.
14. Attempt to edit a finalized score and verify the approved policy.

## 16. Acceptance Criteria

- Preset selection updates the confirmed points correctly.
- Formula-derived values are not mislabeled as manual overrides.
- Range-based rubric decisions are distinguished from policy exceptions.
- True overrides require explicit permission, reason, justification, and audit metadata.
- The scoring engine is the single source of truth.
- Calculated, raw, awarded, and capped values remain distinguishable.
- Invalid values are blocked rather than silently clamped or converted to zero.
- Current evidence decisions do not leak into another evidence item.
- Area and grand-total caps remain correct.
- Finalization identifies active overrides.
- Audit events contain structured safe metadata.
- Finalized edits follow an approved amendment workflow.
- The production build succeeds and modified files introduce no new lint errors.

## 17. Future Backend Phase

Move score decisions and overrides to an authenticated service with:

- server-side rubric validation;
- permission enforcement;
- immutable decision history;
- optimistic concurrency;
- versioned scoring rules;
- finalized-score amendment workflow;
- digital sign-off;
- append-only audit records;
- report and ranking recalculation.
