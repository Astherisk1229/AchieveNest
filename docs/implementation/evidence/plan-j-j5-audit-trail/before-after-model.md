# Before / After State Transition Model Evidence

### Diff Tracking
Meaningful state changes capture precise `before_state` and `after_state` values:
1. **Lifecycle Transitions**: e.g., before: `in_evaluation`, after: `returned_for_revision`.
2. **Scale Overrides**: e.g., before: `ADMINISTRATORS_RANKING_SCALE`, after: `NON_TEACHING_PERSONNEL_RANKING_SCALE`.
3. **Rank Applications**: e.g., before: `ASSISTANT_PROFESSOR_I`, after: `ASSISTANT_PROFESSOR_II`.
4. **Decisions**: e.g., before: `null`, after: `Approved`.
