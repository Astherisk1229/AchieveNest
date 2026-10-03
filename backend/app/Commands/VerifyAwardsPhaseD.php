<?php

namespace App\Commands;

use App\Services\AwardEvaluationService;
use App\Services\EvidenceMappingService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyAwardsPhaseD extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'verify:awards-phase-d';
    protected $description = 'Validates Phase D Evidence Mapping, Verification Gate, and Duplicate-Safe Rule Matching';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — Phase D Evidence Mapping & Duplicate-Safe Rule Matching", 'white');
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

        // 1. Schema & Rule Population
        $ruleCount = $db->table('award_evidence_mapping_rules')->where('is_active', 1)->countAllResults();
        $runTest('MAP-001', 'Evidence mapping rules table populated (56 active rules)', $ruleCount >= 50, "Count: {$ruleCount}");

        $hasCondTable = $db->tableExists('award_evidence_mapping_conditions');
        $runTest('MAP-002', 'Evidence mapping conditions table exists and accessible', $hasCondTable);

        // 2. Verification Gate
        $mappingService = new EvidenceMappingService($db);

        // Pick an active version and criterion (e.g. Leadership criterion)
        $crit = $db->table('award_criteria')->whereIn('code', ['CRIT_NDA_LEADERSHIP', 'CRIT_LEADERSHIP'])->get()->getRowArray();
        $versionId = $crit['scoring_model_version_id'] ?? '';

        $unverifiedRecord = [
            'id'                  => 'test-rec-unverified-001',
            'category_id'         => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', // LEADERSHIP_POSITION
            'subcategory_id'      => null,
            'title'               => 'Unverified Leadership',
            'status'              => 'draft',
            'structured_metadata' => null,
        ];
        $matchesUnverified = $mappingService->findQualifyingEvidenceForCriterion($versionId, $crit['id'], [$unverifiedRecord]);
        $runTest('GATE-001', 'Hard verification gate excludes unverified/draft records', empty($matchesUnverified));

        $verifiedRecord = [
            'id'                  => 'test-rec-verified-001',
            'category_id'         => '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', // LEADERSHIP_POSITION
            'subcategory_id'      => null,
            'title'               => 'Verified SSG Leadership Record',
            'status'              => 'verified',
            'structured_metadata' => null,
        ];
        $matchesVerified = $mappingService->findQualifyingEvidenceForCriterion($versionId, $crit['id'], [$verifiedRecord]);
        $runTest('GATE-002', 'Verified record qualifies through matching rule', count($matchesVerified) === 1);

        // 3. Duplicate Prevention inside Same Criterion
        $duplicateSet = [$verifiedRecord, $verifiedRecord]; // Same record presented twice
        $matchesDedupe = $mappingService->findQualifyingEvidenceForCriterion($versionId, $crit['id'], $duplicateSet);
        $runTest('DEDUP-001', 'Single-criterion duplicate protection prevents double count', count($matchesDedupe) === 1);

        // 4. Cross-Award Evidence Reuse
        $otherCrit = $db->table('award_criteria')->where('code', 'CRIT_LEAD_GOV')->get()->getRowArray();
        $otherVersionId = $otherCrit['scoring_model_version_id'] ?? '';
        $matchesCrossAward = $mappingService->findQualifyingEvidenceForCriterion($otherVersionId, $otherCrit['id'], [$verifiedRecord]);
        $runTest('CROSS-001', 'Cross-award evidence reuse permitted across awards', count($matchesCrossAward) === 1);

        // 5. Structured Metadata Filtering
        $sportsCrit = $db->table('award_criteria')->where('code', 'CRIT_SPORTS_SKILLS_M')->get()->getRowArray();
        $sportsVersionId = $sportsCrit['scoring_model_version_id'] ?? '';
        $sportsRecord = [
            'id'                  => 'test-rec-sports-001',
            'category_id'         => '2d20d412-bf34-46b4-a21d-d7131d4b514a', // SPORTS
            'subcategory_id'      => null,
            'title'               => 'Gold Medalist - University Table Tennis',
            'status'              => 'verified',
            'structured_metadata' => json_encode(['rank' => 'Gold']),
        ];
        $matchesSports = $mappingService->findQualifyingEvidenceForCriterion($sportsVersionId, $sportsCrit['id'], [$sportsRecord]);
        $runTest('META-001', 'Sports evidence matches mapped sports criterion', count($matchesSports) >= 1);

        // 6. Service Compatibility
        try {
            $awardService = new AwardEvaluationService($db);
            $cycle = $awardService->resolveActiveCycle();
            $award = $db->table('award_definitions')->whereIn('code', ['NOTRE_DAME_AWARD', 'MOST_OUTSTANDING_STUDENT'])->get()->getRowArray();
            $student = $db->table('profiles')->where('account_type', 'student')->where('status', 'active')->get()->getRowArray();

            $evalRes = $awardService->evaluateStudentAward($cycle['id'], $award['id'], $student['id']);
            $runTest('SRV-001', 'AwardEvaluationService executes evaluation compatibly', isset($evalRes['potential_percent']));
        } catch (Throwable $e) {
            $runTest('SRV-001', 'AwardEvaluationService executes evaluation compatibly', false, $e->getMessage());
        }

        // 7. Integrity
        $orphanedRules = $db->table('award_evidence_mapping_rules aemr')
            ->join('award_scoring_model_versions asmv', 'asmv.id = aemr.scoring_model_version_id', 'left')
            ->where('asmv.id IS NULL')
            ->countAllResults();
        $runTest('INV-001', '0 orphaned mapping rules without active scoring model version', $orphanedRules === 0);

        CLI::write("========================================================================", 'cyan');
        CLI::write("Phase D Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');

        return $failed === 0 ? 0 : 1;
    }
}
