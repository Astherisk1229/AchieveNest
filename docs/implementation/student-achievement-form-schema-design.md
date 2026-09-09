# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Plan 04 Phase 2 — Form Schema Design Specification
**Authoritative Configuration-Driven Dynamic Form Architecture**

---

### 1. Executive Summary

Plan 04 Phase 2 establishes the canonical, configuration-driven form schema for Student Achievement / Portfolio Record entry in AchieveNest. This design replaces the static generic 3-step wizard with a dynamic, schema-driven architecture that adapts dynamically to the selected **Primary Category** and **Subcategory**.

**Key Achievements of Phase 2:**
1. **Exhaustive 57/57 Subcategory Coverage**: Every subcategory in the locked 9-category taxonomy maps to an explicit schema definition.
2. **Zero Student Award Leakage**: The schema is strictly factual and descriptive; students never select awards or view award rubrics/scoring points.
3. **Structured Metadata Normalization**: Replaces overloaded free-text fields (`rank_conferred`, `description`) with controlled metadata keys (`placement`, `event_level`, `position_level`, `publication_status`, etc.) stored directly in `student_portfolio_records.structured_metadata` JSON.
4. **Zero Code / Schema Changes**: Conforms strictly to Phase 2 boundaries with zero DB schema changes or code alterations.

---

### 2. Phase 1 Baseline

- Database: `achievenest_local` with 9 canonical categories and 57 subcategories in `portfolio_categories` and `portfolio_subcategories`.
- Persistence: `student_portfolio_records` with `structured_metadata` JSON column.
- Engine: `AwardEvidenceMappingService.php` reads structured JSON keys to map records to 15 institutional award rubrics.

---

### 3. Design Goals

- Provide a single configuration registry defining fields, input types, options, validation, and help text.
- Ensure 100% of machine-mapped award scoring facts are captured via controlled structured inputs.
- Maintain responsive, accessible UX across desktop, tablet, and mobile viewports.

---

### 4. Non-Goals

- Implementing frontend rendering components (scheduled for Phase 6).
- Altering database tables or executing schema migrations.
- Rewriting historical legacy records.

---

### 5. Canonical Taxonomy

- Exactly **9 Primary Categories**:
  1. Leadership Position
  2. Organization Membership / Participation
  3. Community Service / Volunteerism
  4. Church / Ministry Involvement
  5. Seminar / Training
  6. Citation / Recognition
  7. Sports
  8. Socio-Cultural / Performing Arts
  9. Campus Journalism
- Exactly **57 Subcategories** with distribution: `4, 5, 5, 4, 8, 8, 10, 7, 6`.
- **0 Forbidden Top-Level Categories**: No `Achievement`, `Civic`, `External`, `Placement`, `Award`, `Competition`.

---

### 6. Schema Registry Architecture

The schema registry is structured as a centralized definition module (`frontend/src/config/portfolioFormSchemaRegistry.js` mirrored by backend validation rules). It maps each unique `category_id + subcategory_id` (or category/subcategory machine code) to its field definitions.

---

### 7. Schema Keying

Schemas are addressable by compound key: `[category_id]:[subcategory_id]` or canonical code `SCHEMA_[CATEGORY]_[SUBCATEGORY]`.

---

### 8. Shared vs Structured Fields

- **Shared Core Fields** (Stored in root `student_portfolio_records` columns):
  - `title` (Activity / Event Title)
  - `organizer_or_body` (Issuing Organization / Venue)
  - `occurrence_date` / `start_date` / `end_date` (Date of Achievement)
  - `description` (Contextual Narrative only)
- **Category-Specific Structured Fields** (Stored in `structured_metadata` JSON):
  - Category-specific attributes (e.g. `placement`, `event_level`, `position_level`, `hours_rendered`, `publication_status`, etc.).

---

### 9. Field Definition Contract

Each field in the schema implements the standard contract:
```json
{
  "key": "placement",
  "label": "Placement / Result",
  "type": "select",
  "required": true,
  "options": [
    { "value": "champion", "label": "Champion / 1st Place" },
    { "value": "first_runner_up", "label": "1st Runner-Up / 2nd Place" },
    { "value": "second_runner_up", "label": "2nd Runner-Up / 3rd Place" },
    { "value": "finalist", "label": "Finalist / Qualifier" },
    { "value": "participant", "label": "Participant / Special Award" }
  ],
  "validation": { "allowedValues": ["champion", "first_runner_up", "second_runner_up", "finalist", "participant"] },
  "helpText": "Select the official placement or rank conferred at the event.",
  "storage": { "target": "structured_metadata", "key": "placement" }
}
```

---

### 10. Input Types

Supported input types:
- `text`: Single-line text input.
- `textarea`: Multi-line text (for narrative context only).
- `select`: Single-select dropdown from controlled options.
- `number`: Numeric inputs (e.g., hours rendered).
- `date`: Standard ISO date picker (`YYYY-MM-DD`).
- `boolean`: Checkbox / toggle switch.

---

### 11. Requiredness

Requiredness is configured per field in the subcategory schema. Fields required for award evaluation (e.g., `position_level` in Leadership, `publication_status` in Journalism) are strictly enforced upon submission.

---

### 12. Controlled Vocabulary

All multi-choice values use standardized machine tokens (`champion`, `regional`, `published`) rather than arbitrary free-form strings.

---

### 13. Validation Metadata

Schemas define client and server validation constraints: `minLength`, `maxLength`, `min`, `max`, `allowedValues`, and regex patterns where applicable.

---

### 14. Help Text

Every category-specific input includes concise, factual guidance clarifying what proof or details are expected, without revealing scoring weights or award targeting.

---

### 15. Visibility Conditions

Conditional fields declare deterministic visibility rules (e.g., `team_role` is only visible when `individual_team === 'team'`).

---

### 16. Hidden-Value Handling

When a conditional field becomes hidden due to a parent field change, its value is automatically purged from the draft state to prevent submitting stale or conflicting metadata.

---

### 17. Category Change Reset Rules

Changing the Primary Category clears the selected Subcategory and all category-specific structured metadata, while retaining shared core fields (`title`, `organizer_or_body`, `occurrence_date`).

---

### 18. Subcategory Change Reset Rules

Changing the Subcategory within the same category resets subcategory-specific metadata while preserving shared category fields (e.g. `academic_year`, `semester`).

---

### 19. Unknown Metadata Policy

The backend validation engine strictly rejects unknown top-level keys in `structured_metadata` (`422 UNKNOWN_METADATA_KEY`) to ensure data purity.

---

### 20. Metadata Versioning Decision

Structured metadata payloads include an implicit `schema_version: "1.0"` attribute to support future evolutionary schema migrations without breaking historical evaluations.

---

### 21. Legacy Compatibility

Legacy records lacking structured JSON keys continue to support read-only fallback parsing in `AwardEvidenceMappingService.php`. New submissions generated by the Phase 6 dynamic form will exclusively write validated structured keys.

---

### 22. Placement / Result Contract

`placement` is strictly a metadata field within competitive categories (Sports, Socio-Cultural, Citations), never a top-level category or subcategory.

---

### 23. Event Level Contract

`event_level` follows a controlled 5-tier taxonomy: `institutional`, `local`, `regional`, `national`, `international`.

---

### 24. Leadership Schema Family

- Covers: SSG, College Council, Club / Organization, Year-Level Leadership.
- Keys: `organization_name`, `position_level`, `position_title`, `tenure_start`, `tenure_end`, `academic_year`, `semester`.

---

### 25. Organization Membership Schema Family

- Covers: General Member, Committee Member, Activity Participant, Facilitator / Organizer, Project Contributor.
- Keys: `organization_name`, `membership_type`, `contribution_level`, `activity_name`, `academic_year`, `semester`.

---

### 26. Community Service Schema Family

- Covers: University-Based, Community-Based, Church-Based, Environmental, Educational Services.
- Keys: `service_type`, `beneficiary_type`, `service_scope`, `hours_rendered`, `leadership_role`, `academic_year`, `semester`.

---

### 27. Church / Ministry Schema Family

- Covers: Campus Ministry, Parish Ministry, Church Organization, Initiated Church Activity.
- Keys: `ministry_context`, `involvement_type`, `parish_or_org`, `leadership_role`, `academic_year`, `semester`.

---

### 28. Seminar / Training Schema Family

- Covers: Leadership Development, Sports Development, Socio-Cultural Development, Journalism Development, Professional Development, etc.
- Keys: `training_type`, `event_level`, `hours_duration`, `organizer_type`, `academic_year`, `semester`.

---

### 29. Citation / Recognition Schema Family

- Covers: Non-academic recognition across 8 domains.
- Keys: `recognition_type`, `recognition_level`, `granting_body`, `placement`, `academic_year`, `semester`.

---

### 30. Sports Schema Family

- Covers: 10 sports disciplines (Basketball, Volleyball, Athletics, Swimming, etc.).
- Keys: `competition_type`, `event_level`, `placement`, `individual_team`, `team_role`, `academic_year`, `semester`.
- Critical Rule: Sports training is excluded here and strictly routed to `Seminar / Training -> Sports Development`.

---

### 31. Socio-Cultural Schema Family

- Covers: 7 performing arts disciplines (Dance, Vocal, Instrumental, Theater, etc.).
- Keys: `performance_type`, `event_level`, `placement`, `individual_group`, `role_description`, `academic_year`, `semester`.
- Critical Rule: Cultural workshops are excluded here and routed to `Seminar / Training -> Socio-Cultural Development`.

---

### 32. Campus Journalism Schema Family

- Covers: News Item, Literary Work, Column, Editorial, Publication Contributor, Publication Officer.
- Keys: `publication_type`, `publication_status`, `authorship_role`, `publication_name`, `publication_date`, `academic_year`, `semester`.

---

### 33. Evidence Rules

All subcategory schemas require at least one supporting document proof (PDF, JPG, PNG up to 10MB) attached before submission.

---

### 34. Draft vs Submit Validation

- **Draft State (`submit_now: false`)**: Allows partial inputs and missing non-core structured fields.
- **Submit State (`submit_now: true`)**: Enforces 100% of required core and category-specific fields.

---

### 35. Verification Alignment

Verifiers (Program Coordinators, Moderators, OSAD) review the exact submitted structured details side-by-side with attached evidence files in `VerificationQueueController.php`.

---

### 36. Award Mapping Separation

Student form fields describe the factual nature of the achievement. Internal award engines map verified records to award rubrics without exposing award rules to students.

---

### 37. Award Mapping Key Coverage

All 15 institutional awards have their evidence requirements completely covered by the structured keys defined in the 57 schemas (100% coverage).

---

### 38. Coverage Matrix

Documented in [phase2-student-achievement-schema-coverage-matrix.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-student-achievement-schema-coverage-matrix.md).

---

### 39. Field Dictionary

Documented in [phase2-student-achievement-field-dictionary.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-student-achievement-field-dictionary.md).

---

### 40. Controlled Vocabulary Dictionary

Documented in [phase2-student-achievement-controlled-vocabularies.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-student-achievement-controlled-vocabularies.md).

---

### 41. Legacy Key Map

Documented in [phase2-student-achievement-legacy-key-map.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/phase2-student-achievement-legacy-key-map.md).

---

### 42. Example Schemas

#### Example 1: Campus Journalism News Item (`SCHEMA_JOURN_NEWS`)
```json
{
  "category_id": "2b09cd61-7a23-4466-be58-889398e8f201",
  "subcategory_id": "40000009-0001-0000-0000-000000000001",
  "fields": [
    { "key": "publication_name", "label": "Publication Name", "type": "text", "required": true },
    { "key": "publication_type", "label": "Publication Format", "type": "select", "required": true, "defaultValue": "news" },
    { "key": "publication_status", "label": "Circulation Status", "type": "select", "required": true, "options": ["published", "draft"] },
    { "key": "authorship_role", "label": "Byline / Authorship Role", "type": "select", "required": true },
    { "key": "publication_date", "label": "Date of Publication", "type": "date", "required": true }
  ]
}
```

#### Example 2: Sports Basketball (`SCHEMA_SPORT_BBALL`)
```json
{
  "category_id": "2d20d412-bf34-46b4-a21d-d7131d4b514a",
  "subcategory_id": "40000007-0001-0000-0000-000000000001",
  "fields": [
    { "key": "competition_type", "label": "Competition Format", "type": "select", "required": true },
    { "key": "event_level", "label": "Geographic Scope / Level", "type": "select", "required": true },
    { "key": "placement", "label": "Placement / Result", "type": "select", "required": true },
    { "key": "individual_team", "label": "Format", "type": "select", "required": true, "defaultValue": "team" },
    { "key": "team_role", "label": "Role in Team", "type": "select", "required": true }
  ]
}
```

---

### 43. Frontend Renderer Handoff

Provides the schema contract ready for consumption by Phase 6 dynamic components (`DynamicPortfolioFormRenderer.jsx`).

---

### 44. Backend Validation Handoff

Provides the metadata key and controlled vocabulary definitions for server-side payload validation in Phase 7.

---

### 45. Shared Core Fields Handoff

Defines the boundary between shared top-level attributes and category-specific JSON metadata for Phase 3.

---

### 46. Schema Invariants

1. Exactly 9 primary categories.
2. Exactly 57 subcategory schemas.
3. Zero student award exposure.
4. Zero free-text parsing required for new records.
5. Campus Journalism unpublished drafts are strictly non-scorable.

---

### 47. Decision Register

| Decision | Final Outcome |
|---|---|
| Form Architecture | Configuration-Driven Dynamic Schema |
| Primary Categories | Exactly 9 (Locked) |
| Subcategories | Exactly 57 (Locked) |
| Metadata Storage | `student_portfolio_records.structured_metadata` JSON |
| Award Exposure | Zero (100% Hidden from Student) |
| Schema Mutability | Code-Configured Registry (Synchronized Frontend/Backend) |

---

### 48. Phase 2 Exit Decision

All 57 subcategories, field definitions, controlled vocabularies, and mapping dependencies have been fully designed and certified.

**PLAN 04 PHASE 2 DECISION: GO FOR PHASE 3 — SHARED CORE FIELDS.**
