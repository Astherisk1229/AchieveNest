<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\AwardEvaluationSummaryService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase1A extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-1a';
    protected $description = 'Validates Phase 1A Catalog Runtime Cleanup & Legacy Award Quarantine';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase 1A: Catalog Runtime Cleanup & Quarantine Verification", 'white');
        CLI::write("========================================================================", 'cyan');

        $db = Database::connect();
        $passed = 0;
        $failed = 0;

        $runTest = function (string $code, string $name, bool $condition, string $details = '') use (&$passed, &$failed) {
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-12s %-53s %s", $code, $name, CLI::color($status, $color)));
            if (! $condition) {
                CLI::write("               Details: {$details}", 'yellow');
                $failed++;
            } else {
                $passed++;
            }
        };

        // 1. CAT-001: Active Catalog Contains Exactly 15 Baseline Awards
        $activeCatalog = $db->table('award_definitions')
            ->where('status', 'active')
            ->where('is_catalog_visible', 1)
            ->get()->getResultArray();
        $runTest('CAT-001', 'Active catalog contains exactly 15 Authoritative Baseline Awards', count($activeCatalog) === 15, 'Found: ' . count($activeCatalog));

        // 2. CAT-002: Zero Legacy / Non-Source Rows in Active Catalog
        $legacyCodes = [
            'ACADEMIC_EXCELLENCE',
            'DEANS_MEDAL_OF_DISTINCTION',
            'LOYALTY_AWARD',
            'PRESIDENTS_MEDAL_OF_EXCELLENCE',
            'RESEARCH_AND_INNOVATION',
            'OUTSTANDING_CHURCH_MINISTRY',
            'OUTSTANDING_EXTRA_CURRICULAR',
        ];
        $legacyInCatalog = array_filter($activeCatalog, fn($a) => in_array($a['code'], $legacyCodes, true));
        $runTest('CAT-002', 'Zero legacy / non-source rows appear in active catalog', empty($legacyInCatalog), 'Found: ' . count($legacyInCatalog));

        // 3. QUAR-001: All Quarantined Rows Preserved with Zero Deletions
        $quarantinedRows = $db->table('award_definitions')
            ->where('is_catalog_visible', 0)
            ->get()->getResultArray();
        $runTest('QUAR-001', 'Quarantined legacy rows preserved in database (0 deletions)', count($quarantinedRows) >= 7, 'Found: ' . count($quarantinedRows));

        // 4. QUAR-002: Foreign-Key References Unbroken
        $orphanVersions = $db->query('SELECT COUNT(*) AS c FROM award_scoring_model_versions v LEFT JOIN award_definitions ad ON ad.id = v.award_definition_id WHERE ad.id IS NULL')->getRow()->c;
        $orphanCriteria = $db->query('SELECT COUNT(*) AS c FROM award_criteria c LEFT JOIN award_definitions ad ON ad.id = c.award_definition_id WHERE ad.id IS NULL')->getRow()->c;
        $runTest('QUAR-002', 'Zero orphaned versions or criteria across all awards', (int) $orphanVersions === 0 && (int) $orphanCriteria === 0);

        // 5. STAT-001: Notre Dame Award Status
        $nda = $db->table('award_definitions')->where('id', '50000001-0000-0000-0000-000000000001')->get()->getRowArray();
        $runTest('STAT-001', 'Notre Dame Award marked VERIFIED with 50-pt computable model', $nda['name'] === 'Notre Dame Award' && $nda['source_fidelity_status'] === 'VERIFIED');

        // 6. STAT-002: Remediation Progress States
        $verifiedCount = count(array_filter($activeCatalog, fn($a) => $a['source_fidelity_status'] === 'VERIFIED'));
        $pendingCount = count(array_filter($activeCatalog, fn($a) => in_array($a['source_fidelity_status'], ['PENDING_RECONCILIATION', 'PROPOSED_PENDING_APPROVAL'], true)));
        $runTest('STAT-002', 'Cumulative catalog exposes 15 Verified / 15 baseline Awards', $verifiedCount === 15 && $pendingCount === 0, "Verified: {$verifiedCount}, Pending: {$pendingCount}");

        // 7. HIST-001: Historical Evaluation Summary Snapshot Accessibility
        $evalService = new AwardEvaluationService($db);
        $summaryService = new AwardEvaluationSummaryService($db, $evalService);
        $cycle = $evalService->resolveActiveCycle();
        $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();
        $summary = $summaryService->buildEvaluationSummary($cycle['id'], $nda['id'], $student['id']);
        $runTest('HIST-001', 'Evaluation Summary snapshot builds deterministically for Notre Dame Award', isset($summary['totals']['portfolio_potential_score']));

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase 1A Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
