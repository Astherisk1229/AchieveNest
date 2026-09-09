# AchieveNest — Plan 04 Phase 1
## Evidence: Award Evidence Mapping Input Map

---

### 1. Authoritative AwardEvidenceMappingService Inputs

| Award Family | Required Portfolio Category | Required Subcategories / Code Patterns | Structured Metadata Keys Read | Text Parsing Dependencies |
|---|---|---|---|---|
| **Campus Journalism** | `CAMPUS_JOURNALISM` | `COMP_JOURN_NEWS`, `COMP_JOURN_LITERARY`, `COMP_JOURN_COLUMN`, `COMP_JOURN_EDITORIAL` | `publication_type`, `publication_status`, `role` | Fallback search on title (`str_contains`) if legacy record |
| **Sports & Athletics** | `SPORTS` | 10 sports subcategories (`Basketball`, `Volleyball`, etc.) | `competition_type`, `event_level`, `placement`, `result`, `academic_year` | Minimal (prioritizes structured metadata) |
| **Socio-Cultural / Performing Arts** | `SOCIO_CULTURAL` | 7 disciplines (`Dance`, `Vocal`, `Theater`, etc.) | `discipline`, `event_level`, `placement`, `performance_role` | None if structured fields populated |
| **Leadership** | `LEADERSHIP_POSITION`, `ORG_MEMBERSHIP` | 4 leadership subcategories + 5 org subcategories | `position_level`, `role_title`, `tenure_months`, `academic_year` | Title scanning for keyword role if metadata missing |
| **Community Service & Volunteerism** | `COMMUNITY_SERVICE` | 5 service subcategories | `hours_rendered`, `beneficiary_type`, `service_scope`, `role` | Description scanning for hours if structured key missing |
| **Church & Ministry** | `CHURCH_MINISTRY` | 4 ministry subcategories | `involvement_type`, `parish_or_org`, `role` | None if structured |
| **Seminar / Training** | `SEMINAR_TRAINING` | 8 training subcategories (`Leadership Dev`, `Sports Dev`, etc.) | `training_level`, `hours`, `topic_area` | Title parsing for legacy rows |
| **Citation / Recognition** | `CITATION_RECOGNITION` | 8 non-academic recognition subcategories | `award_level`, `granting_body`, `placement` | None if structured |

---

### 2. Multi-Award Support & Double-Counting Invariants

- **Multi-Award Support**: One verified record may support criteria across multiple distinct awards (e.g. an SSG President record can support both `LEADERSHIP_AWARD` and `NOTRE_DAME_AWARD`).
- **Same-Subsection Double-Counting**: Guarded by composite key tracking (`$seenSubsectionKeys["{$matchedCritId}:{$matchedCompId}:{$sourceRecordId}"]`) to prevent the same evidence from scoring twice in the same subsection.
- **Hard Verification Gate**: Non-verified records (`status !== 'verified'`) are strictly excluded with reason `RECORD_NOT_VERIFIED`.
