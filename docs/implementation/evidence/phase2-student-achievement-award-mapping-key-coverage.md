# AchieveNest — Plan 04 Phase 2
## Evidence: Award Evidence Mapping Key Coverage

---

### 1. Engine Requirement vs Schema Key Coverage

| Award Definition | Required Criteria / Components | Required Metadata Key in `AwardEvidenceMappingService` | Covered by Schema? | Free-Text Parsing Required for New Records? |
|---|---|---|---|---|
| **Campus Journalism Award** | `COMP_JOURN_NEWS`, `COMP_JOURN_LITERARY`, `COMP_JOURN_COLUMN`, `COMP_JOURN_EDITORIAL` | `publication_type`, `publication_status`, `authorship_role` | **YES** (`SCHEMA_JOURN_*`) | **NO** |
| **Outstanding Athlete of the Year (F/M)** | `COMP_SPORTS_SKILLS`, `COMP_SPORTS_PARTICIPATION`, `COMP_SPORTS_AWARDS` | `competition_type`, `event_level`, `placement`, `individual_team` | **YES** (`SCHEMA_SPORT_*`) | **NO** |
| **Outstanding Performance Sports (F/M)** | `COMP_SPORTS_SKILLS`, `COMP_SPORTS_PARTICIPATION`, `COMP_SPORTS_AWARDS` | `competition_type`, `event_level`, `placement`, `individual_team` | **YES** (`SCHEMA_SPORT_*`) | **NO** |
| **Outstanding Performer of the Year (F/M)** | `COMP_SOCIO_SKILLS`, `COMP_SOCIO_PARTICIPATION`, `COMP_SOCIO_AWARDS` | `performance_type`, `event_level`, `placement`, `individual_group` | **YES** (`SCHEMA_SOCIO_*`) | **NO** |
| **Outstanding Performance Socio-Cultural (F/M)** | `COMP_SOCIO_SKILLS`, `COMP_SOCIO_PARTICIPATION`, `COMP_SOCIO_AWARDS` | `performance_type`, `event_level`, `placement`, `individual_group` | **YES** (`SCHEMA_SOCIO_*`) | **NO** |
| **Outstanding Student Leader of the Year** | `CAMPUS_LEAD`, `GOVERNANCE` | `organization_name`, `position_level`, `position_title` | **YES** (`SCHEMA_LEAD_*`) | **NO** |
| **Leadership Award** | `CAMPUS_LEAD`, `COMMUNITY_LEAD` | `organization_name`, `position_level`, `leadership_role` | **YES** (`SCHEMA_LEAD_*`, `SCHEMA_COMM_*`) | **NO** |
| **Outstanding Member of the Year** | `MEMBERSHIP`, `CONTRIBUTION` | `organization_name`, `membership_type`, `contribution_level` | **YES** (`SCHEMA_ORG_*`) | **NO** |
| **Outstanding Volunteer of the Year** | `VOLUNTEER`, `DIRECT_SERVICE` | `service_type`, `beneficiary_type`, `service_scope`, `hours_rendered` | **YES** (`SCHEMA_COMM_*`) | **NO** |
| **Notre Dame Award & SMC Award** | Institutional Holistic Matrix | Evaluates across all 9 structured categories | **YES** (All 57 Schemas) | **NO** |

---

### 2. Invariant Verification

- **Free-Text Parsing for New Records**: **0** (All award scoring engines can directly read `structured_metadata` JSON keys).
- **Student Award Selectors**: **0** (Students never pick an award or enter points).
- **Scoring Logic Exposure**: **0** (Students only provide verifiable historical facts).
