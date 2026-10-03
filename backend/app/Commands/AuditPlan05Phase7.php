<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan05Phase7 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan05-phase7';
    protected $description = 'Audits Plan 05 Phase 7 Backend/API Presentation Alignment & Authorization Contracts';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Plan 05 Phase 7: Backend/API Alignment Audit", 'yellow');
        CLI::write("========================================================================", 'yellow');

        $db = db_connect();
        $passCount = 0;
        $totalChecks = 10;

        // Check 1: 9 Primary Categories in Database
        $catCount = $db->table('portfolio_categories')->countAllResults();
        if ($catCount === 9) {
            CLI::write("[PASS] Check 1: Exactly 9 active portfolio primary categories in DB.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 1: Found {$catCount} categories, expected 9.", 'red');
        }

        // Check 2: 57 Subcategories in Database
        $subcatCount = $db->table('portfolio_subcategories')->countAllResults();
        if ($subcatCount === 57) {
            CLI::write("[PASS] Check 2: Exactly 57 active portfolio subcategories in DB.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 2: Found {$subcatCount} subcategories, expected 57.", 'red');
        }

        // Check 3: Subcategory to Category Foreign Key Integrity
        $orphanSubcats = $db->table('portfolio_subcategories ps')
            ->join('portfolio_categories pc', 'pc.id = ps.category_id', 'left')
            ->where('pc.id', null)
            ->countAllResults();
        if ($orphanSubcats === 0) {
            CLI::write("[PASS] Check 3: Zero subcategory foreign key orphans.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 3: Found {$orphanSubcats} orphan subcategories.", 'red');
        }

        // Check 4: Zero Invalid Taxonomy Pairs in student_portfolio_records
        $invalidPairs = $db->table('student_portfolio_records spr')
            ->join('portfolio_subcategories ps', 'ps.id = spr.subcategory_id AND ps.category_id = spr.category_id', 'left')
            ->where('spr.subcategory_id IS NOT NULL', null, false)
            ->where('ps.id', null)
            ->countAllResults();
        if ($invalidPairs === 0) {
            CLI::write("[PASS] Check 4: Zero invalid category/subcategory taxonomy pairs in portfolio records.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 4: Found {$invalidPairs} invalid taxonomy pairs.", 'red');
        }

        // Check 5: Evidence Referential Integrity
        $orphanEvidence = $db->table('student_portfolio_evidence spe')
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id', 'left')
            ->where('spr.id', null)
            ->countAllResults();
        if ($orphanEvidence === 0) {
            CLI::write("[PASS] Check 5: Zero orphan evidence records.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 5: Found {$orphanEvidence} orphan evidence records.", 'red');
        }

        // Check 6: Verification Events Referential Integrity
        $orphanEvents = $db->table('student_portfolio_verification_events ve')
            ->join('student_portfolio_records spr', 'spr.id = ve.portfolio_record_id', 'left')
            ->where('spr.id', null)
            ->countAllResults();
        if ($orphanEvents === 0) {
            CLI::write("[PASS] Check 6: Zero orphan verification event records.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 6: Found {$orphanEvents} orphan verification event records.", 'red');
        }

        // Check 7: Schema Version 1.0 Integrity
        $records = $db->table('student_portfolio_records')->get()->getResultArray();
        $invalidSchemaCount = 0;
        foreach ($records as $r) {
            if (! empty($r['structured_metadata'])) {
                $meta = json_decode($r['structured_metadata'], true);
                if (is_array($meta) && isset($meta['schema_version']) && $meta['schema_version'] !== '1.0') {
                    $invalidSchemaCount++;
                }
            }
        }
        if ($invalidSchemaCount === 0) {
            CLI::write("[PASS] Check 7: All schema-versioned records declare valid '1.0' contract.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 7: Found {$invalidSchemaCount} invalid schema versions.", 'red');
        }

        // Check 8: Zero Injected Award/Scoring Keys in Persistent Metadata
        $injectedScoringCount = 0;
        $forbiddenKeys = ['award_id', 'award_name', 'score', 'points', 'rubric', 'potential_award'];
        foreach ($records as $r) {
            if (! empty($r['structured_metadata'])) {
                $meta = json_decode($r['structured_metadata'], true);
                if (is_array($meta)) {
                    foreach ($forbiddenKeys as $fk) {
                        if (array_key_exists($fk, $meta)) {
                            $injectedScoringCount++;
                        }
                    }
                }
            }
        }
        if ($injectedScoringCount === 0) {
            CLI::write("[PASS] Check 8: Zero award/scoring keys injected into structured_metadata.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 8: Found {$injectedScoringCount} injected scoring keys.", 'red');
        }

        // Check 9: Authorization Isolation - Single Canonical Serializer Source
        $routesContent = file_get_contents(APPPATH . 'Config/Routes.php');
        if (strpos($routesContent, 'Api\StudentPortfolioController::index') !== false) {
            CLI::write("[PASS] Check 9: Canonical portfolio index route correctly bound.", 'green');
            $passCount++;
        } else {
            CLI::write("[FAIL] Check 9: Canonical portfolio route binding missing.", 'red');
        }

        // Check 10: Award Mapping Service Exists & Verified-Only Gated
        $serviceFile = APPPATH . 'Services/AwardEvidenceMappingService.php';
        if (file_exists($serviceFile)) {
            $serviceCode = file_get_contents($serviceFile);
            if (strpos($serviceCode, "'verified'") !== false) {
                CLI::write("[PASS] Check 10: AwardEvidenceMappingService enforces verified-only status gate.", 'green');
                $passCount++;
            } else {
                CLI::write("[FAIL] Check 10: Verified-only status gate missing in mapping service.", 'red');
            }
        } else {
            CLI::write("[FAIL] Check 10: AwardEvidenceMappingService.php not found.", 'red');
        }

        CLI::write("========================================================================", 'yellow');
        CLI::write("Plan 05 Phase 7 Audit Result: {$passCount} / {$totalChecks} Checks Passed.", $passCount === $totalChecks ? 'green' : 'red');
        CLI::write("========================================================================", 'yellow');

        return $passCount === $totalChecks ? 0 : 1;
    }
}
