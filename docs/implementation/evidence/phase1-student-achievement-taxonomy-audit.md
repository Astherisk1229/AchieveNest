# AchieveNest — Plan 04 Phase 1
## Evidence: Taxonomy & Category/Subcategory Audit

---

### 1. Database Taxonomy Baseline in `achievenest_local`

The database `achievenest_local` contains **exactly 9 canonical categories** and **57 canonical subcategories** in `portfolio_categories` and `portfolio_subcategories`.

| Canonical Category ID | Category Code | Canonical Name | Subcategories Count | Expected Count | Match Status |
|---|---|---|---:|---:|---|
| `8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646` | `LEADERSHIP_POSITION` | Leadership Position | 4 | 4 | PASS |
| `c9a6d837-78f4-4516-b2db-d438ae717be5` | `ORG_MEMBERSHIP` | Organization Membership / Participation | 5 | 5 | PASS |
| `ace24637-66f7-4329-9451-ccc61e18eab9` | `COMMUNITY_SERVICE` | Community Service / Volunteerism | 5 | 5 | PASS |
| `779a9653-d972-47ce-93dc-cb381150568b` | `CHURCH_MINISTRY` | Church / Ministry Involvement | 4 | 4 | PASS |
| `802de57b-54d7-4d38-9433-052ca9636380` | `SEMINAR_TRAINING` | Seminar / Training | 8 | 8 | PASS |
| `448beadb-a254-4cb6-84fb-a3d5f4f8822e` | `CITATION_RECOGNITION` | Citation / Recognition | 8 | 8 | PASS |
| `2d20d412-bf34-46b4-a21d-d7131d4b514a` | `SPORTS` | Sports | 10 | 10 | PASS |
| `6514e620-b5a0-4ff2-9353-0ee8787b5ce6` | `SOCIO_CULTURAL` | Socio-Cultural / Performing Arts | 7 | 7 | PASS |
| `2b09cd61-7a23-4466-be58-889398e8f201` | `CAMPUS_JOURNALISM` | Campus Journalism | 6 | 6 | PASS |
| **Total** | | **9 Categories** | **57** | **57** | **100% PASS** |

---

### 2. Forbidden Top-Level Categories Check

- Forbidden categories: `Achievement`, `Civic`, `External`, `Placement`, `Award`, `Competition`.
- DB Verification: **0** forbidden top-level categories in `portfolio_categories`.

---

### 3. Classification-Rule Verification in Database

1. **Leadership Seminar**:
   - Belongs to `Seminar / Training` -> Subcategory `Leadership Development` (`40000005-0001-0000-0000-000000000001`).
2. **Sports Clinic / Training**:
   - Belongs to `Seminar / Training` -> Subcategory `Sports Development` (`40000005-0001-0000-0000-000000000004`).
3. **Performing Arts Workshop**:
   - Belongs to `Seminar / Training` -> Subcategory `Socio-Cultural / Performing Arts Development` (`40000005-0001-0000-0000-000000000005`).
4. **Placement / Result**:
   - Stored in `structured_metadata` JSON (`placement`, `result`), not as a top-level category or subcategory.
