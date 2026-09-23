<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyAwardsPhaseC extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-c';
    protected $description = 'Validates Phase C Award Catalog, Award Cycle, Scoring Model Versioning, Authority Metadata, and Service Compatibility';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase C Award Catalog, Cycle & Version Verification", 'white');
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

        // 1. Preserved Masters Baseline
        $awardCount = $db->table('award_definitions')->where('status', 'active')->countAllResults();
        $criteriaCount = $db->table('award_criteria')->countAllResults();
        $cycleCount = $db->table('award_cycles')->countAllResults();

        $runTest('CHK-001', '15 Active Award Masters preserved', $awardCount === 15, "Count: {$awardCount}");
        $runTest('CHK-002', '40 Award Criteria preserved', $criteriaCount === 40, "Count: {$criteriaCount}");
        $runTest('CHK-003', 'Active Award Cycle preserved', $cycleCount >= 1, "Count: {$cycleCount}");

        // 2. Scoring Model Versions
        $versionCount = $db->table('award_scoring_model_versions')->where('status', 'published')->countAllResults();
        $runTest('VER-001', '15 Published Scoring Model Versions exist (v1.0)', $versionCount === 15, "Count: {$versionCount}");

        $linkedCriteria = $db->table('award_criteria')->where('scoring_model_version_id IS NOT NULL')->countAllResults();
        $runTest('VER-002', 'All 40 criteria linked to active version', $linkedCriteria === 40, "Count: {$linkedCriteria}");

        // 3. Rule Authority Metadata
        $sysOpAwards = $db->table('award_definitions')
            ->whereIn('code', ['LOYALTY_AWARD', 'RESEARCH_AND_INNOVATION'])
            ->where('authority_status', 'SYSTEM_OPERATIONALIZATION')
            ->countAllResults();
        $officialAwards = $db->table('award_definitions')
            ->whereNotIn('code', ['LOYALTY_AWARD', 'RESEARCH_AND_INNOVATION'])
            ->where('authority_status', 'OFFICIAL')
            ->countAllResults();
        $runTest('AUTH-001', 'Award definitions authority status mapped correctly (13 Official, 2 SysOp)', $sysOpAwards === 2 && $officialAwards === 13);

        $sysOpCriteria = $db->table('award_criteria')->where('authority_status', 'SYSTEM_OPERATIONALIZATION')->countAllResults();
        $officialCriteria = $db->table('award_criteria')->where('authority_status', 'OFFICIAL')->countAllResults();
        $runTest('AUTH-002', 'Criteria authority status mapped correctly (34 Official, 6 SysOp)', $sysOpCriteria === 6 && $officialCriteria === 34);

        // 4. Threshold & Eligibility Governance
        $invalidThresholds = $db->table('award_scoring_model_versions')
            ->where('candidate_threshold_percent !=', 80.00)
            ->countAllResults();
        $runTest('THR-001', 'Candidate threshold preserved at 80.00% across all versions', $invalidThresholds === 0);

        $nonGraduatingVersions = $db->table('award_scoring_model_versions')
            ->where('graduating_only !=', 1)
            ->countAllResults();
        $runTest('GRAD-001', 'graduating_only = 1 preserved across all active versions', $nonGraduatingVersions === 0);

        // 5. Criterion Components Structure
        $hasComponentTable = $db->tableExists('award_criterion_components');
        $runTest('COMP-001', 'award_criterion_components table exists and is accessible', $hasComponentTable);

        // 6. Service Compatibility Verification
        try {
            $awardService = new AwardEvaluationService($db);
            $cycle = $awardService->resolveActiveCycle();
            $hasActiveCycle = $cycle !== null && isset($cycle['id']);

            // Pick an active award (e.g. NOTRE_DAME_AWARD)
            $award = $db->table('award_definitions')->whereIn('code', ['NOTRE_DAME_AWARD', 'MOST_OUTSTANDING_STUDENT'])->get()->getRowArray();
            $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();

            $evalSuccess = false;
            if ($hasActiveCycle && $award && $student) {
                $evalRes = $awardService->evaluateStudentAward($cycle['id'], $award['id'], $student['id']);
                $evalSuccess = isset($evalRes['potential_percent']);
            }

            $runTest('SRV-001', 'AwardEvaluationService executes evaluation compatibly', $evalSuccess);
        } catch (Throwable $e) {
            $runTest('SRV-001', 'AwardEvaluationService executes evaluation compatibly', false, $e->getMessage());
        }

        // 7. Integrity & Orphan Invariants
        $orphanedModels = $db->table('award_scoring_model_versions asmv')
            ->join('award_definitions ad', 'ad.id = asmv.award_definition_id', 'left')
            ->where('ad.id IS NULL')
            ->countAllResults();
        $runTest('INV-001', '0 orphaned scoring model versions', $orphanedModels === 0);

        $orphanedCrit = $db->table('award_criteria ac')
            ->join('award_scoring_model_versions asmv', 'asmv.id = ac.scoring_model_version_id', 'left')
            ->where('asmv.id IS NULL')
            ->countAllResults();
        $runTest('INV-002', '0 orphaned criteria without active scoring model version', $orphanedCrit === 0);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase C Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
