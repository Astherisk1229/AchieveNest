# AchieveNest — Phase D Database Safety & Migration Preparation Report

**Date:** August 30, 2026  
**Phase:** Phase D — Database Safety & Migration Preparation  
**Status:** `PASS`  
**Scope:** Execute database safety gate, backup verification, schema snapshot, reference state preservation, and preparation of additive unapplied migration `2026-08-30-000028_AddOrganizationLogoMetadata.php` for Phase E.

---

## 1. Repository Baseline

- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `ad23bd5` (`feat(osad): add confirmable modal close behavior`)
- **Phase D Commit:** `9d2e105` (`chore(db): prepare organization logo migration`)
- **Working Tree Clean:** `YES` (Scoped Phase D migration file and safety report)

---

## 2. Runtime Verification

- **PHP Runtime:** `8.2.29` (`C:\wamp64\bin\php\php8.2.29\php.exe`)
- **MySQL Engine:** `8.4.7` (Community Server - GPL)
- **Canonical Database:** `achievenest_local` (Active on default port 3306)
- **WAMP Services:** `wampapache64` (Running), `wampmysqld64` (Running), `wampmariadb64` (Running on isolated port 3307)

---

## 3. Verified Database Backup

- **Backup Path:** `backend/writable/backups/achievenest_local_pre_osad_org_migration_20260830_010017.sql`
- **File Size:** `426,216 bytes`
- **SHA-256 Checksum:** `B805317A93C60084F0A422D9020F64EC71793FCCA70BE555D1DD4FF325A155EB`
- **Status:** Verified valid, complete, and uncorrupted mysqldump with triggers and routines.

---

## 4. Current Database Artifact Inventory

- **Canonical Table Count:** `58 tables` in `achievenest_local`
- **CodeIgniter Migration Files:** `27 files` (`2026-08-21-000001` through `2026-08-30-000027`)
- **CodeIgniter Seeders:** `5 files` in `backend/app/Database/Seeds/`
- **MySQL Defense Replay Files:** `11 files` (`000001_identity_and_institutional.sql` through `000011_local_auth_sessions.sql`)
- **Applied Migration State:** Fully synchronized with baseline schema.

---

## 5. Historical Migration Hash Manifest (Migrations 1–27)

| Version | Migration File Name | SHA-256 Hash |
| :--- | :--- | :--- |
| `000001` | `2026-08-21-000001_CreateIdentityAndAcademicFoundation.php` | `ED14D1231AFA3BD151C96BC48855CC30E29C69AAC34325FE699D7110CCB8BC29` |
| `000002` | `2026-08-23-000002_AddStructuredNameToProfiles.php` | `F3E5C07B145C83D8CD3862192D4DB18CEE8345A48AD59D06DC101B2754673B80` |
| `000003` | `2026-08-23-000003_ExpandAdminAccountTypesAndAddRoleAssignmentEvents.php` | `ED0B2A59E22AE60D04BE85620857CF5B5D4A0E1358187C17173CC78917EEB336` |
| `000004` | `2026-08-24-000004_EnforceAdminProfileIntegrity.php` | `57C127B9EE38FFF9E12A082466022AAD1D1E2ED8ADD606C7741F831E017C7DC1` |
| `000005` | `2026-08-24-000005_CreatePersonnelEvaluationDomain.php` | `8A5735EA152524F8056C738C7D4A2904BF75B80F69C01B4B6C5512B47D14EDD6` |
| `000006` | `2026-08-25-000006_ReplaceDepartmentSecretaryWithDean.php` | `F5BC045E19A00B8812B6364316D9E17B0DF2FB9A61ECEEF1D0FD6F5389659CA3` |
| `000007` | `2026-08-25-000007_CreatePasswordResetRequestsDomain.php` | `4BB36B1483BE8D99A752535141A8874FCBD2C50AB99E5A8EAAFF9A3533DF64FD` |
| `000008` | `2026-08-26-000008_CreatePersonnelAccomplishmentDomain.php` | `C24D9B8DAD002922BED8489E3A58D8625D68C221F3568A5741639CF007C9A4FF` |
| `000009` | `2026-08-26-000009_CreateQualificationGateDomain.php` | `136F258524881A48C5F1756ADA8AFFD31BEEAD5A198E596AE27B8A88DC208154` |
| `000010` | `2026-08-26-000010_CreateDeficiencyAndReportDomain.php` | `7A6E3D2C78FBAE2EEFCABFB1D89B4E86191F2D6CCEAE7E7FDCD7E1066A59E442` |
| `000011` | `2026-08-26-000011_EnableRLSOnSensitiveHRTables.php` | `913B4E93360E98D6E410A613FC1DD7EC8AB4FF742470E71CE41285FEA76D9AF4` |
| `000012` | `2026-08-26-000012_AddHRPerformanceIndexes.php` | `E15BA1929D47FF906D1AEA3E311A89F0DB3D03EF30CA5EAEB4CBEFAFF6A46A97` |
| `000013` | `2026-08-26-000013_ReconcileHRFinalizationSchema.php` | `0EB5A5AFB5B67EC1D0F736549CFC2E7C4F554DB1FD071E976E6070624EB62BDE` |
| `000014` | `2026-08-27-000014_CreateTargetInstitutionalStructure.php` | `A11CBC1589A97369B455A17FCAEF86BF8F9BE1CD710D565B17EB9556C427B557` |
| `000015` | `2026-08-27-000015_CreateIdentityAffiliationGovernance.php` | `77C67B4EF285656E68F48343BA71EE804BA5936A94344D06941CA532F995D71C` |
| `000016` | `2026-08-27-000016_CreateStudentPortfolioDomain.php` | `A2BE31DC9C069CD45ECB219A5550A47F857F3D34929485C66C3E49576F0AC349` |
| `000017` | `2026-08-27-000017_CreateAwardScoringDomain.php` | `9ECD6C29AC224EAB953DD9CA82278539C7079662F9423A387082A2E631BA9DE0` |
| `000018` | `2026-08-27-000018_CreateNotificationsCertificatesAudit.php` | `126277137B5C8C675E3E8FA460988F726C77FA65711C5D2338C61EAF66127FDC` |
| `000019` | `2026-08-27-000019_HardenAdminAndHrConstraints.php` | `F380E4208817AC17D81761B7B2A5E71A355A5A294CABDEE268E18F58D3D8E362` |
| `000020` | `2026-08-27-000020_CreateAuthorizationAndIntegrityGuards.php` | `AC5EFC1801155C844670C28E087AC99AE6F5DE65F8DDA5C5D814B27CE9772B53` |
| `000021` | `2026-08-27-000021_CreateCompatibilityViewsAndValidation.php` | `78C0AF75E43C2B92D151F95EC94A817E472830845BA2F61314C78DE551B5A63F` |
| `000022` | `2026-08-27-000022_EnableTargetRlsAndGrants.php` | `09AD27D3BAD46CDE1C21F5128FB210530DEF2A2FE254DBF913D8FBDF799CD83B` |
| `000023` | `2026-08-27-000023_CreateStorageBucketsAndPolicies.php` | `9A0F34925D80F5AEC4C2A57D2616E03C455ED1CBF6ABD74C23631ED50338FD92` |
| `000024` | `2026-08-27-000024_SeedPermanentReferenceData.php` | `409352C8888B068E2BBCB5635467C101A42603D08A7C95B3FF9FDFBDE121876D` |
| `000025` | `2026-08-27-000025_AutomateAwardInterviewEligibility.php` | `8EE627CE8FD87A4EA246F0D6EB9F545DB8B8F63A35AB22F435F325EFE3D513AC` |
| `000026` | `2026-08-27-000026_HardenEvidenceUploadSecurity.php` | `2C2504FD3608DBDF939FC5A45E225FC0995C8F95CACC2D3F9CD5C6CA9C208B81` |
| `000027` | `2026-08-30-000027_PopulateAllAwardCriteria.php` | `9CC51DAEC0B00582B89CFC77CC50728BEE3DB49B1A837623BD09E5B289658E15` |

*Historical migrations 1–27 remain completely immutable.*

---

## 6. Organization Schema Baseline Snapshot

```sql
CREATE TABLE `organizations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_organizations_college` (`college_id`),
  CONSTRAINT `fk_organizations_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_organizations_category` CHECK ((`category` in (_utf8mb4'academic_college',_utf8mb4'co_curricular',_utf8mb4'special_interest',_utf8mb4'socio_cultural',_utf8mb4'religious',_utf8mb4'sports',_utf8mb4'student_council'))),
  CONSTRAINT `ck_organizations_scope` CHECK ((`scope` in (_utf8mb4'university',_utf8mb4'college',_utf8mb4'program'))),
  CONSTRAINT `ck_organizations_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Confirmation of Logo Column Absence
- `logo_storage_key exists`: **NO**
- `logo_original_name exists`: **NO**
- `logo_mime_type exists`: **NO**
- `logo_updated_at exists`: **NO**

---

## 7. Organization Data & Relationships Baseline

### 7.1 Existing Organizations (2 Rows)
1. **CSS** (`40000000-0000-0000-0000-000000000001`): Computer Science Society | Scope: `college` | Category: `academic_college` | College: `CEAC` | Status: `active`
2. **DEMO_JPIA** (`d0000000-0000-0000-0002-000000000000`): Demo Junior Philippine Institute of Accountants | Scope: `college` | Category: `academic_college` | College: `CBA` | Status: `active`

### 7.2 Program Affiliations
- Total Rows: `0` (`organization_program_affiliations` table verified ready for Phase E program mapping).

### 7.3 Moderator Assignments (2 Rows)
1. CSS: Assigned to Personnel `10000000-0000-0000-0000-000000000010` (Active).
2. DEMO_JPIA: Assigned to Personnel `d0000000-0000-0000-0001-000000000010` (Active).

### 7.4 Scope & Category Domain Integrity
- `scope`: strictly in `('university', 'college', 'program')`.
- `category`: strictly in `('academic_college', 'co_curricular', 'special_interest', 'socio_cultural', 'religious', 'sports', 'student_council')`.
- No orphan foreign keys or domain violations found.

---

## 8. Award Reference Data Baseline Snapshot

- `award_definitions`: **15 rows** (all 15 canonical university awards active).
- `award_criteria`: **40 rows** (reconciled across all 15 awards).
- `award_scoring_rules`: **0 rows** (deferred/rule-engine fallback intact).
- `award_portfolio_mappings`: **0 rows** (taxonomy domain mapping active in service layer).
- `candidate_threshold_percent`: **80.00%** on all 15 awards.

---

## 9. Organization Logo Metadata Design

### Design Decision
Following the repository's file storage standard (as seen in `events_and_certificates.sql` and `student_portfolio_evidence`), the organization table will store safe relative storage keys, original file names, detected MIME types, and update timestamps. No binary blobs are stored in MySQL.

### Schema Addition:
```sql
ALTER TABLE organizations
    ADD COLUMN logo_storage_key VARCHAR(500) NULL AFTER status,
    ADD COLUMN logo_original_name VARCHAR(255) NULL AFTER logo_storage_key,
    ADD COLUMN logo_mime_type VARCHAR(100) NULL AFTER logo_original_name,
    ADD COLUMN logo_updated_at DATETIME(6) NULL AFTER logo_mime_type;
```

- **Nullability:** All fields are `NULL` by default because an organization logo is optional.
- **Lengths:** `VARCHAR(500)` for storage key, `VARCHAR(255)` for file name, `VARCHAR(100)` for MIME type, `DATETIME(6)` for microsecond timestamp precision.

---

## 10. Prepared Additive CodeIgniter Migration (UNAPPLIED)

- **File:** [`backend/app/Database/Migrations/2026-08-30-000028_AddOrganizationLogoMetadata.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-08-30-000028_AddOrganizationLogoMetadata.php)
- **Status in Phase D:** `PREPARED / UNAPPLIED` (To be executed in Phase E).
- **PHP Syntax Validation:** `PASS` (`No syntax errors detected`).
- **Safety Review:**
  - `up()` is strictly additive on `organizations`.
  - `down()` cleanly drops only the 4 logo columns without data loss on core fields.
  - Does not insert, update, or delete existing rows.

---

## 11. Replay Synchronization & Rollback Plan

### Replay Strategy for Phase E:
When applied in Phase E, the replay migration will be created as:
`backend/database/mysql-defense/migrations/000012_organization_logo_metadata.sql`
preserving the existing `000001` through `000011` files.

### Rollback Strategy:
```sql
ALTER TABLE organizations
    DROP COLUMN logo_storage_key,
    DROP COLUMN logo_original_name,
    DROP COLUMN logo_mime_type,
    DROP COLUMN logo_updated_at;
```

---

## 12. Disposable Database Replay Verification

A temporary database `achievenest_test_replay_disposable` was created on MySQL 8.4.7 and replayed through all 11 defense scripts:
- Replay Table Count: **57 core defense tables**
- Replay Award Definitions: **15 rows**
- Replay Award Criteria: **40 rows**
- Replay Determinism: **PASS** (Zero drift, 100% repeatable).
- Temporary database dropped cleanly after test.

---

## 13. Backend / API Non-Implementation Verification

Verified that:
- `backend/app/Controllers/OrganizationController.php`: **ABSENT**
- `backend/app/Services/OrganizationService.php`: **ABSENT**
- `/api/v1/osad/organizations` Backend Routes: **ABSENT**
- Organization logo backend endpoints: **ABSENT**

---

## 14. Phase D Stop Conditions Matrix

| Stop Condition | Status | Result |
| :--- | :---: | :---: |
| Backup verified with non-zero size & hash | Verified (`426,216 bytes`) | **PASS** |
| Working tree clean before start | Verified | **PASS** |
| MySQL canonical database reachable | Verified (`MySQL 8.4.7`) | **PASS** |
| Current migration state clearly documented | Verified (27 migrations) | **PASS** |
| Historical migration hashes unchanged | Verified (Manifest recorded) | **PASS** |
| Organization data conforms to constraints | Verified (2 rows clean) | **PASS** |
| Replay baseline remains deterministic | Verified on disposable DB | **PASS** |
| Logo columns currently absent from canonical DB | Verified | **PASS** |
| Prepared migration is purely additive & syntax valid | Verified (`php -l` passed) | **PASS** |

---

## 15. Phase Result

```text
PHASE D: PASS — SAFE TO PROCEED TO PHASE E
```
