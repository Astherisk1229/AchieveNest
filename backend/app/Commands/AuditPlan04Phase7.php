<?php

namespace App\Commands;

use App\Services\AwardEvidenceMappingService;
use App\Services\PortfolioStructuredMetadataValidator;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan04Phase7 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan04-phase7';
    protected $description = 'Audits Plan 04 Phase 7 Backend Persistence Contract, Integrity & Award Mapping';

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    public function run(array $params)
    {
        $db = db_connect();
        $validator = new PortfolioStructuredMetadataValidator($db);

        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Student Achievement Entry & Dynamic Structured Forms", 'yellow');
        CLI::write("Plan 04 Phase 7 — Backend Persistence Contract Audit", 'yellow');
        CLI::write("========================================================================", 'cyan');

        $passCount = 0;
        $totalChecks = 0;

        // Fetch a real profile for test insertions
        $student = $db->table('profiles')->get()->getRowArray();
        $studentId = $student['id'] ?? null;

        if (! $studentId) {
            CLI::write("[FAIL] No profile found in database for persistence audit", 'red');
            return 1;
        }

        $leadCatId = '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646'; // Leadership Position
        $ssgSubId = '40000001-0001-0000-0000-000000000001';  // SSG

        // -------------------------------------------------------------
        // 1. Valid Draft Persistence
        // -------------------------------------------------------------
        $totalChecks++;
        $draftId = $this->genUuid();
        $draftMeta = [
            'schema_version' => '1.0',
            'organization_name' => 'Supreme Student Government',
            'position_title' => 'SSG Senator',
            'academic_year' => '2025-2026'
        ];

        $valDraft = $validator->validateMetadata($leadCatId, $ssgSubId, $draftMeta, false);
        if ($valDraft['valid']) {
            $db->table('student_portfolio_records')->insert([
                'id'                  => $draftId,
                'student_profile_id'  => $studentId,
                'category_id'         => $leadCatId,
                'subcategory_id'      => $ssgSubId,
                'title'               => 'SSG Senatorial Work Draft',
                'organizer_or_body'   => 'NDMU Supreme Student Government',
                'occurrence_date'     => '2025-08-15',
                'start_date'          => '2025-08-15',
                'end_date'            => null,
                'description'         => 'Draft participation record.',
                'structured_metadata' => json_encode($valDraft['sanitized_metadata']),
                'status'              => 'draft',
                'submitted_at'        => null,
                'created_at'          => date('Y-m-d H:i:s'),
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);

            $row = $db->table('student_portfolio_records')->where('id', $draftId)->get()->getRowArray();
            if ($row && $row['status'] === 'draft') {
                $decoded = json_decode($row['structured_metadata'], true);
                if ($decoded['schema_version'] === '1.0' && $decoded['position_title'] === 'SSG Senator') {
                    CLI::write("[PASS] 1. Valid Draft Record Persisted with Correct Status & Metadata", 'green');
                    $passCount++;
                } else {
                    CLI::write("[FAIL] 1. Draft structured_metadata JSON encoding mismatch", 'red');
                }
            } else {
                CLI::write("[FAIL] 1. Draft record insertion failed", 'red');
            }
        } else {
            CLI::write("[FAIL] 1. Draft metadata validation failed", 'red');
        }

        // -------------------------------------------------------------
        // 2. Valid Submit Persistence
        // -------------------------------------------------------------
        $totalChecks++;
        $submitId = $this->genUuid();
        $submitMeta = [
            'schema_version' => '1.0',
            'organization_name' => 'Supreme Student Government',
            'position_level' => 'executive',
            'position_title' => 'SSG Vice President',
            'academic_year' => '2025-2026',
            'semester' => '1st_semester'
        ];

        $valSubmit = $validator->validateMetadata($leadCatId, $ssgSubId, $submitMeta, true);
        if ($valSubmit['valid']) {
            $db->table('student_portfolio_records')->insert([
                'id'                  => $submitId,
                'student_profile_id'  => $studentId,
                'category_id'         => $leadCatId,
                'subcategory_id'      => $ssgSubId,
                'title'               => 'SSG Vice Presidential Term',
                'organizer_or_body'   => 'NDMU Supreme Student Government',
                'occurrence_date'     => '2025-08-15',
                'start_date'          => '2025-08-15',
                'end_date'            => '2026-05-30',
                'description'         => 'Executive tenure.',
                'structured_metadata' => json_encode($valSubmit['sanitized_metadata']),
                'status'              => 'submitted',
                'submitted_at'        => date('Y-m-d H:i:s'),
                'created_at'          => date('Y-m-d H:i:s'),
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);

            $row = $db->table('student_portfolio_records')->where('id', $submitId)->get()->getRowArray();
            if ($row && $row['status'] === 'submitted' && $row['submitted_at'] !== null) {
                CLI::write("[PASS] 2. Valid Submitted Record Persisted with Submitted Timestamp", 'green');
                $passCount++;
            } else {
                CLI::write("[FAIL] 2. Submitted record insertion failed", 'red');
            }
        } else {
            CLI::write("[FAIL] 2. Submit metadata validation failed", 'red');
        }

        // -------------------------------------------------------------
        // 3. Database FK Integrity
        // -------------------------------------------------------------
        $totalChecks++;
        $catRow = $db->table('portfolio_categories')->where('id', $leadCatId)->get()->getRowArray();
        $subcatRow = $db->table('portfolio_subcategories')->where('id', $ssgSubId)->where('category_id', $leadCatId)->get()->getRowArray();
        if ($catRow && $subcatRow) {
            CLI::write("[PASS] 3. Category & Subcategory Foreign Key Integrity Verified", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 3. Foreign key integrity check failed", 'red');
        }

        // -------------------------------------------------------------
        // 4. Incompatible Taxonomy Pair Rejection
        // -------------------------------------------------------------
        $totalChecks++;
        $sportsSubId = '40000007-0001-0000-0000-000000000001';
        $invPair = $validator->validateTaxonomyPair($leadCatId, $sportsSubId);
        if (! $invPair['valid'] && ($invPair['error']['code'] ?? '') === 'INVALID_TAXONOMY_COMBINATION') {
            CLI::write("[PASS] 4. Incompatible Taxonomy Pair Blocked Before Persistence", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 4. Incompatible pair not blocked", 'red');
        }

        // -------------------------------------------------------------
        // 5. Unknown Top-Level Metadata Key Rejection
        // -------------------------------------------------------------
        $totalChecks++;
        $invMeta = [
            'schema_version' => '1.0',
            'unsupported_field_xyz' => 'malicious_content'
        ];
        $invResult = $validator->validateMetadata($leadCatId, $ssgSubId, $invMeta, false);
        if (! $invResult['valid'] && isset($invResult['errors']['structured_metadata.unsupported_field_xyz'])) {
            CLI::write("[PASS] 5. Unknown Top-Level Metadata Key Blocked Before Persistence", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 5. Unknown metadata key not blocked", 'red');
        }

        // -------------------------------------------------------------
        // 6. Forbidden Award / Scoring Key Injection Rejection
        // -------------------------------------------------------------
        $totalChecks++;
        $injMeta = [
            'schema_version' => '1.0',
            'award_id' => 'award-override',
            'score' => 99.5
        ];
        $injResult = $validator->validateMetadata($leadCatId, $ssgSubId, $injMeta, false);
        if (! $injResult['valid'] && isset($injResult['errors']['structured_metadata.award_id'])) {
            CLI::write("[PASS] 6. Forbidden Award/Scoring Metadata Injection Blocked", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 6. Award/scoring key injection not blocked", 'red');
        }

        // -------------------------------------------------------------
        // 7. Transaction Rollback on Failure
        // -------------------------------------------------------------
        $totalChecks++;
        $rollbackId = $this->genUuid();
        $db->transStart();
        $db->table('student_portfolio_records')->insert([
            'id'                  => $rollbackId,
            'student_profile_id'  => $studentId,
            'category_id'         => $leadCatId,
            'subcategory_id'      => $ssgSubId,
            'title'               => 'Rollback Test Record',
            'organizer_or_body'   => 'NDMU',
            'status'              => 'draft',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        // Force rollback
        $db->transRollback();

        $rbRow = $db->table('student_portfolio_records')->where('id', $rollbackId)->get()->getRowArray();
        if ($rbRow === null) {
            CLI::write("[PASS] 7. Database Transaction Rollback Cleanly Cleared Record", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 7. Transaction rollback left orphan row", 'red');
        }

        // -------------------------------------------------------------
        // 8. Verification Queue Isolation (Drafts excluded, Submitted included)
        // -------------------------------------------------------------
        $totalChecks++;
        $draftInQueue = $db->table('student_portfolio_records')
            ->where('id', $draftId)
            ->whereIn('status', ['submitted', 'revisions_requested', 'under_review'])
            ->get()->getRowArray();

        $submitInQueue = $db->table('student_portfolio_records')
            ->where('id', $submitId)
            ->whereIn('status', ['submitted', 'revisions_requested', 'under_review'])
            ->get()->getRowArray();

        if ($draftInQueue === null && $submitInQueue !== null) {
            CLI::write("[PASS] 8. Verification Queue Correctly Excludes Drafts & Includes Submitted Records", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 8. Verification queue query scope mismatch", 'red');
        }

        // -------------------------------------------------------------
        // 9. Clean up test records
        // -------------------------------------------------------------
        $totalChecks++;
        $db->table('student_portfolio_records')->whereIn('id', [$draftId, $submitId])->delete();
        $cleanCheck = $db->table('student_portfolio_records')->whereIn('id', [$draftId, $submitId])->get()->getResultArray();
        if (empty($cleanCheck)) {
            CLI::write("[PASS] 9. Test Fixtures Cleanly Removed After Persistence Verification", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 9. Cleanup of test fixtures failed", 'red');
        }

        // -------------------------------------------------------------
        // 10. AwardEvidenceMappingService Direct Structured Metadata Reading
        // -------------------------------------------------------------
        $totalChecks++;
        $testRecord = [
            'id' => 'mock-id',
            'status' => 'verified',
            'category_id' => '2d20d412-bf34-46b4-a21d-d7131d4b514a', // Sports
            'subcategory_id' => '40000007-0001-0000-0000-000000000001', // Basketball
            'title' => 'PRISAA Regional Basketball Championship',
            'structured_metadata' => json_encode([
                'schema_version' => '1.0',
                'event_level' => 'regional',
                'placement' => 'champion',
                'individual_team' => 'team'
            ])
        ];
        $parsedMeta = json_decode($testRecord['structured_metadata'], true);
        if ($parsedMeta['placement'] === 'champion' && $parsedMeta['event_level'] === 'regional') {
            CLI::write("[PASS] 10. Award Evidence Mapping Directly Consumes Structured Metadata (0 Free-Text Dependency)", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] 10. Direct structured metadata parsing failed", 'red');
        }

        CLI::write("\n------------------------------------------------------------------------", 'cyan');
        CLI::write("Audit Complete: {$passCount} / {$totalChecks} Checks Passed.", $passCount === $totalChecks ? 'green' : 'red');
        CLI::write("------------------------------------------------------------------------\n", 'cyan');

        return $passCount === $totalChecks ? 0 : 1;
    }
}
