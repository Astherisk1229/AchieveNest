# Unresolved Rule Register — Plan K Phase K0

The following business items are formally registered as **UNRESOLVED BY DESIGN** at Plan K Phase K0 freeze and must not be guessed, synthesized, or converted into pass/fail expectations:

1. **`UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION`**:
   - The policy for long-term audit trail handling following complete owner-authorized account deletion (retain audit vs. anonymize vs. delete) remains an open institutional governance question.
2. **`POSITION / JOB TITLE SOURCE — UNRESOLVED`**:
   - `position_title` remains a descriptive string on personnel records. No fixed canonical catalog exists or is inferred.
3. **`NO GUESSED ACADEMIC-RANK RULE — NON-TEACHING FACULTY + NON-ACADEMIC`**:
   - Non-Teaching Faculty in Non-Academic units are governed by institutional administrative salary grades rather than academic teaching ranks.
4. **`ANNUAL REVIEW / SUBJECT-TO-EVALUATION EXACT ALGORITHM`**:
   - The external administrative metric algorithm that flags `subject_to_evaluation = true` is treated as an input boundary rather than reimplemented.
5. **`EVALUATION CYCLE AUTOMATED ROLLOVER SCHEDULE`**:
   - The automated rollover timeline for annual cycles remains manually configured by HR.
