# AchieveNest — Plan 04 Phase 2
## Evidence: Controlled Vocabulary Dictionary

---

### 1. `event_level` / `recognition_level` / `service_scope`

| Machine Value | Display Label | Semantic Scope |
|---|---|---|
| `institutional` | Institutional / Campus-Wide | NDMU intramurals, college days, campus events |
| `local` | Local / City / Municipal | Koronadal City, provincial meets, local extensions |
| `regional` | Regional (Region XII) | SOCCSKSARGEN, PRISAA Regional, DOST XII events |
| `national` | National Level | National PRISAA, SCUAA National, CHED National |
| `international` | International Level | International conferences, cross-border invitationals |

---

### 2. `placement`

| Machine Value | Display Label | Scoring Semantic |
|---|---|---|
| `champion` | Champion / 1st Place | 1st rank / Gold medal tier |
| `first_runner_up` | 1st Runner-Up / 2nd Place | 2nd rank / Silver medal tier |
| `second_runner_up` | 2nd Runner-Up / 3rd Place | 3rd rank / Bronze medal tier |
| `finalist` | Finalist / Qualifier / 4th Place | Advanced finalist stage |
| `participant` | Participant / Special Award | Non-podium official participant |

---

### 3. `publication_status` (Campus Journalism Critical Invariant)

| Machine Value | Display Label | Scorable? | Note |
|---|---|---|---|
| `published` | Published / Circulated | **YES** | Verified circulation in official publication |
| `draft` | Draft / In-Progress / Unpublished | **NO** | Excluded by mapping service with `JOURNALISM_NOT_PUBLISHED` |

---

### 4. `publication_type`

| Machine Value | Display Label | Mapped Component |
|---|---|---|
| `news` | News Item / Report | `COMP_JOURN_NEWS` |
| `literary` | Literary Piece (Poetry / Essay / Story) | `COMP_JOURN_LITERARY` |
| `column` | Column / Opinion Article | `COMP_JOURN_COLUMN` |
| `editorial` | Editorial Article | `COMP_JOURN_EDITORIAL` |
| `feature` | Feature Article | `COMP_JOURN_NEWS` (Standard feature) |

---

### 5. `position_level`

| Machine Value | Display Label | Leadership Tier |
|---|---|---|
| `executive` | Executive Officer (President / VP / Governor) | Top governance |
| `officer` | Officer (Secretary / Treasurer / Auditor / PIO) | Standard officer |
| `committee_head` | Committee Chairperson / Head | Functional committee lead |
| `year_representative` | Year-Level Representative | Cohort representative |

---

### 6. `contribution_level`

| Machine Value | Display Label | Contribution Scope |
|---|---|---|
| `lead_organizer` | Lead Organizer / Project Chairperson | Primary responsibility |
| `committee_member` | Active Committee Member / Facilitator | Direct active support |
| `general_contributor` | General Contributor / Member | Standard participant |
