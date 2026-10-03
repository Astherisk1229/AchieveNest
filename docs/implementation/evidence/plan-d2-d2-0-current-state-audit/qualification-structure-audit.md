# Qualification Field Structure Audit — Plan D2 Phase D2-0

### Persistence Structure
- **Table**: `personnel_profiles`
- **Field**: `qualification_summary` (`VARCHAR(255)` / nullable string)
- **Current State**: Free-text string containing degree and discipline description (e.g. `"Master of Science in Information Technology"` or `"Ph.D. in Educational Management"`).

### Qualification Review & Verification Records
- **Table**: `qualification_reviews`
- **Model / Service**: `QualificationReview.php` / `hrAdminService.recordQualificationReview`
- **Endpoints**: `POST /api/v1/hr/personnel/{id}/qualification-reviews`
- **Metadata Fields**:
  - `highest_degree_level` (`baccalaureate`, `masters`, `doctoral`, `post_doctoral`)
  - `is_board_licensed` (`boolean`)
  - `license_title` (`string`)
  - `verification_status` (`verified`, `pending`, `rejected`)
  - `reviewed_by` / `reviewed_at`

### Findings
- The UI modal currently provides only a plain text input (`qualificationSummary`), without structured degree tier or licensure selectors.
- Plan E resolvers require structured degree tier (`doctoral`, `masters`, `board_licensure`, `baccalaureate`) or text parsing to infer initial rank recommendations.
