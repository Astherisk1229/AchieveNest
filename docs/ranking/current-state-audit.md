# Ranking Setup current-state audit

## Active implementation

The rendered HR route is `/hr/personnel-evaluation-setup`, backed by `PersonnelEvaluationSetupPage.jsx`. The navigation label is **Ranking Setup**. The page now separates **Ranking Periods** from **Criteria Sheets** and uses the existing evaluation-scale domain rather than adding parallel ranking tables.

## Domain equivalence

| Required concept | Existing authoritative implementation |
| --- | --- |
| Criteria sheet | `evaluation_scales` |
| Immutable version | `evaluation_scale_versions` |
| Areas and rules | `evaluation_scale_areas`, `evaluation_scale_categories`, `evaluation_scale_subcategories`, `evaluation_scale_criteria` |
| Draft / Active / Superseded | `draft` / `approved` / `retired` |
| Ranking period | `personnel_evaluation_periods` |
| Locked criteria version | `personnel_evaluation_periods.evaluation_scale_version_id` |
| Evaluation snapshot | `personnel_evaluations` criteria, group, position, college, and department snapshots |
| Governance audit | `evaluation_scale_change_events` and period lifecycle events |

The equivalent existing lifecycle vocabulary is intentionally preserved to avoid duplicate status concepts.

## Deterministic mapping and official seeds

- `FACULTY` resolves only to `ADMINISTRATORS_RANKING_SCALE`.
- `NON_TEACHING_FACULTY` resolves only to `NON_TEACHING_PERSONNEL_RANKING_SCALE`.
- Other groups are rejected and receive no automatic criteria.
- The official Faculty version has maximum 160, passing 120, and area caps 70/50/40.
- The official Non-Teaching Faculty version has maximum 150 and passing 75.
- Source document references are retained on both initial versions. The governance migration classifies them as `SEEDED_OFFICIAL_SOURCE`; HR-created clones use `HR_REVISION`.

## Version governance

Creating a version clones the complete existing area/category/subcategory/criterion hierarchy into a new draft. Publishing accepts drafts only, validates totals, unique codes, manual-mode declarations, and deterministic configuration, locks the sheet and version rows, retires the previous active version, publishes the draft, and writes audit events in one transaction. Historical records are retained.

Existing periods and evaluations continue to reference their exact version after a later version is published. Period creation resolves criteria from the selected personnel group; HR cannot arbitrarily bind a different sheet. Operational service rules lock personnel group and criteria identity after the period leaves draft or receives submissions.

## Scoring model

Existing category modes provide the required semantics: deterministic fixed/formula/dimensional/lookup modes are automatic; `MANUAL` explicitly prevents invented formulas; and `CATEGORY_CAP` represents capped aggregation. Category, area, and overall maxima remain structured. Evaluation snapshots preserve the scoring context required for historical reproduction.

## Unresolved business policy

Eligibility for personnel added, transferred, or reclassified after a period opens is deliberately **unresolved**. This implementation does not guess automatic inclusion or exclusion. Existing evaluation snapshots remain on their original period/group/version. A separate business decision is required before introducing a late-eligibility rule.

## Criteria Sheets implementation

The active Criteria Sheets workspace now provides dedicated Faculty and Non-Teaching renderers, semantic official-format tables, wide-table keyboard scrolling, section anchors, a sticky context/action bar, inline draft point/max editing, optimistic concurrency, unsaved-change protection, save, validation readiness, version comparison, aggregate cap simulation, transactional publication, history, provenance, usage counts, and browser print/PDF export.

The existing normalized seed supports faithful seminar-level columns, shared-cap relationships, years-of-service progression, weighted manual criteria, and engagement calculations. Several Faculty source concepts—especially the full Guest Lecturer dimensions, Publication scope/type matrix, Recognition Nominee/Awardee matrix, and Instructional Materials type columns—are not represented as normalized option rows in the current database. The renderer therefore shows their stored official breakdown rows without inventing absent dimensions or scores. Completing those exact matrices requires a new, source-verified criterion-option/cap-membership migration before their cells can safely become editable or comparable.

The current simulation is explicitly an isolated aggregate-cap preview. Criterion-specific formula simulation remains dependent on the same normalized option enrichment; manual criteria are correctly reported as manual and never auto-calculated.
