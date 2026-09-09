# Department Semantic Domain Audit — Plan D2 Phase D2-0

### Disambiguation of 5 Distinct Domain Usages of "Department"

1. **Academic Department / Program**:
   - Refers to academic degree programs or discipline-specific teaching divisions (e.g. *Department of Information Technology*, *Department of Chemical Engineering*).
   - Backed by: `academic_programs` table (`academic_program_id`).

2. **Non-Academic Office / Administrative Unit**:
   - Refers to operational non-teaching units (e.g. *Records Section*, *Library*, *Business Office*, *Human Resource Management Office*).
   - Backed by: `administrative_units` table (`administrative_unit_id`).

3. **Evaluation Summary Display Header ("Department")**:
   - The printed/rendered summary field label on evaluation scorecards and promotion review handoffs.
   - For Academic Personnel: Canonical source must resolve to **College Name** (`colleges.college_name`).
   - For Non-Academic Personnel: Canonical source must resolve to **Administrative Unit Name** (`administrative_units.unit_name`).

4. **Personnel Directory Filter / Column**:
   - UI table search and organization filter column in `/hr-admin/personnel-directory`.
   - Projects either `college_name` or `administrative_unit_name` depending on `organizational_side`.

5. **Legacy Free-Text Department**:
   - Legacy text field `department` on old user profiles or prototype schemas, not linked to relational FKs.
