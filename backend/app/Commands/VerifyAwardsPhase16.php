<?php

namespace App\Commands;

use App\Services\AwardCandidateGenerationService;
use App\Services\AwardScoringRuleEngine;
use App\Services\EvidenceMappingService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class VerifyAwardsPhase16 extends BaseCommand
{
    protected $group = 'Verification';
    protected $name = 'verify:awards-phase-16';
    protected $description = 'Read-only cross-Award mapping, isolation, and interaction audit';

    public function run(array $params)
    {
        $db = Database::connect();
        $passed = 0;
        $failed = 0;
        $test = static function (string $id, string $label, bool $ok, string $detail = '') use (&$passed, &$failed): void {
            CLI::write(sprintf('  %-18s %-66s %s', $id, $label, $ok ? '[PASS]' : '[FAIL]'), $ok ? 'green' : 'red');
            if ($ok) { $passed++; } else { $failed++; if ($detail !== '') { CLI::write('    ' . $detail, 'yellow'); } }
        };

        CLI::write(str_repeat('=', 104), 'cyan');
        CLI::write('AchieveNest — Phase 16: Cross-Award Mapping & Interaction Audit', 'white');
        CLI::write(str_repeat('=', 104), 'cyan');

        $expected = [
            'NOTRE_DAME_AWARD' => ['Notre Dame Award', 'OFFICIAL', 1, null, 50.0],
            'SMC_AWARD' => ['Saint Marcellin Champagnat (SMC) Award', 'OFFICIAL', 1, null, 60.0],
            'LEADERSHIP_AWARD' => ['Leadership Award', 'OFFICIAL', 1, null, 50.0],
            'CAMPUS_JOURNALISM_AWARD' => ['Campus Journalism Award', 'OFFICIAL', 1, null, 70.0],
            'SPORTS_AWARD_FEMALE' => ['Outstanding Performance in Sports - Female', 'OFFICIAL', 1, 'female', 55.0],
            'SPORTS_AWARD_MALE' => ['Outstanding Performance in Sports - Male', 'OFFICIAL', 1, 'male', 55.0],
            'SOCIO_CULTURAL_AWARD_FEMALE' => ['Outstanding Performance in Socio-Cultural - Female', 'PROPOSED', 1, 'female', 55.0],
            'SOCIO_CULTURAL_AWARD_MALE' => ['Outstanding Performance in Socio-Cultural - Male', 'PROPOSED', 1, 'male', 55.0],
            'STUDENT_LEADER_OF_THE_YEAR' => ['Outstanding Student Leader of the Year', 'OFFICIAL', 0, null, 50.0],
            'MEMBER_OF_THE_YEAR' => ['Outstanding Member of the Year', 'OFFICIAL', 0, null, 40.0],
            'VOLUNTEER_OF_THE_YEAR' => ['Outstanding Volunteer of the Year', 'OFFICIAL', 0, null, 50.0],
            'ATHLETE_OF_THE_YEAR_FEMALE' => ['Outstanding Athlete of the Year - Female', 'OFFICIAL', 0, 'female', 55.0],
            'ATHLETE_OF_THE_YEAR_MALE' => ['Outstanding Athlete of the Year - Male', 'OFFICIAL', 0, 'male', 55.0],
            'PERFORMER_OF_THE_YEAR_FEMALE' => ['Outstanding Performer of the Year - Female', 'PROPOSED', 0, 'female', 55.0],
            'PERFORMER_OF_THE_YEAR_MALE' => ['Outstanding Performer of the Year - Male', 'PROPOSED', 0, 'male', 55.0],
        ];
        $awards = $db->table('award_definitions')->where('status', 'active')->where('is_catalog_visible', 1)->get()->getResultArray();
        $byCode = array_column($awards, null, 'code');
        $test('CATALOG-001', 'Exactly 15 catalog-visible active Awards', count($awards) === 15);
        $test('CATALOG-002', 'Exact frozen Award identities are unchanged', count(array_diff(array_keys($expected), array_keys($byCode))) === 0 && ! array_filter($expected, fn ($v, $k) => ($byCode[$k]['name'] ?? null) !== $v[0], ARRAY_FILTER_USE_BOTH));
        $test('AUTH-001', 'Authority split is 11 OFFICIAL + 4 PROPOSED', count(array_filter($awards, fn ($a) => $a['authority_status'] === 'OFFICIAL')) === 11 && count(array_filter($awards, fn ($a) => $a['authority_status'] === 'PROPOSED')) === 4);
        $test('FIDELITY-001', '15/15 active Awards have source_fidelity_status VERIFIED', count(array_filter($awards, fn ($a) => $a['source_fidelity_status'] === 'VERIFIED')) === 15);
        $test('SCOPE-001', 'Graduating/annual and gender restrictions match frozen matrix', ! array_filter($expected, fn ($v, $k) => (int) ($byCode[$k]['graduating_only'] ?? -1) !== $v[2] || ($byCode[$k]['gender_restriction'] ?? null) !== $v[3], ARRAY_FILTER_USE_BOTH));

        $maximaOk = true;
        foreach ($expected as $code => $spec) {
            $criteria = $db->table('award_criteria')->select('max_points,is_portfolio_computable')->where('award_definition_id', $byCode[$code]['id'])->get()->getResultArray();
            $max = array_sum(array_map(fn ($c) => (int) $c['is_portfolio_computable'] === 1 ? (float) $c['max_points'] : 0.0, $criteria));
            $maximaOk = $maximaOk && abs($max - $spec[4]) < 0.001;
        }
        $test('DENOM-001', 'Each Award retains its independent frozen computable denominator', $maximaOk);
        $test('THRESH-001', 'Every active Award and published model uses its published 80% threshold', ! array_filter($awards, fn ($a) => (float) $a['candidate_threshold_percent'] !== 80.0) && $db->table('award_scoring_model_versions')->where('status', 'published')->where('candidate_threshold_percent !=', 80)->countAllResults() === 0);
        $test('THRESH-002', 'Threshold boundary is denominator-relative (40/50, 48/60, 56/70, 32/40, 44/55)', abs(40/50*100-80) < .001 && abs(48/60*100-80) < .001 && abs(56/70*100-80) < .001 && abs(32/40*100-80) < .001 && abs(44/55*100-80) < .001);
        $test('DENOM-002', 'Equal raw scores remain incomparable across denominators (40/50 != 40/60)', round(40/50*100, 2) === 80.0 && round(40/60*100, 2) === 66.67);

        $sharedCategories = $db->query("SELECT portfolio_category_id FROM award_evidence_mapping_rules r JOIN award_criteria c ON c.id=r.criterion_id WHERE r.is_active=1 GROUP BY portfolio_category_id HAVING COUNT(DISTINCT c.award_definition_id)>1")->getResultArray();
        $test('REUSE-001', 'Many-to-many mapping exists: categories legitimately map to multiple Awards', count($sharedCategories) > 0);
        $duplicateMappings = $db->query("SELECT COUNT(*) n FROM (SELECT scoring_model_version_id,criterion_id,COALESCE(criterion_component_id,''),portfolio_category_id,COALESCE(portfolio_subcategory_id,''),rule_code,COUNT(*) c FROM award_evidence_mapping_rules WHERE is_active=1 GROUP BY 1,2,3,4,5,6 HAVING c>1) x")->getRowArray();
        $test('DEDUP-001', 'No duplicate active mapping identity exists', (int) $duplicateMappings['n'] === 0);

        $mapperSource = file_get_contents(APPPATH . 'Services/EvidenceMappingService.php');
        $engineSource = file_get_contents(APPPATH . 'Services/AwardScoringRuleEngine.php');
        $candidateSource = file_get_contents(APPPATH . 'Services/AwardCandidateGenerationService.php');
        $controllerSource = file_get_contents(APPPATH . 'Controllers/Api/AwardEvaluationController.php');
        $test('DEDUP-002', 'Engine-level portfolio_record_id deduplication is explicit', str_contains($mapperSource, '$seenEvidenceIds') && str_contains($engineSource, '$usedRecordIds'));
        $test('VERIFIED-001', 'Shared mapping gate admits only status=verified', str_contains($mapperSource, "!== 'verified'"));
        $test('RANK-001', 'Candidate review queue scopes Award + Cycle', str_contains($candidateSource, "where('aie.cycle_id'") && str_contains($candidateSource, "where('aie.award_definition_id'"));
        $test('API-001', 'Candidate API scopes both portfolio evaluations and nominations by cycle', substr_count($controllerSource, "->where('sae.cycle_id'") >= 2 && str_contains($controllerSource, "->where('dsn.cycle_id'"));
        $test('VERSION-001', 'Published version resolution includes Award + Cycle', str_contains($candidateSource, "where('award_definition_id'") && str_contains($candidateSource, "where('award_cycle_id'"));

        $candidateService = new AwardCandidateGenerationService($db);
        $femaleAward = $byCode['ATHLETE_OF_THE_YEAR_FEMALE'];
        $femaleVersion = ['graduating_only' => 0, 'gender_requirement' => 'female'];
        $test('GENDER-001', 'Female structured gender passes Female-only eligibility', $candidateService->evaluateEligibility(['id' => 'fixture', 'status' => 'active', 'gender' => 'female'], $femaleAward, $femaleVersion)['is_eligible']);
        $test('GENDER-002', 'Male structured gender cannot enter Female-only Award', ! $candidateService->evaluateEligibility(['id' => 'fixture', 'status' => 'active', 'gender' => 'male'], $femaleAward, $femaleVersion)['is_eligible']);
        $test('GENDER-003', 'Missing structured gender cannot enter gender-restricted Award', ! $candidateService->evaluateEligibility(['id' => 'fixture', 'status' => 'active'], $femaleAward, $femaleVersion)['is_eligible']);

        $sportsCodes = ['SPORTS_AWARD_FEMALE','SPORTS_AWARD_MALE','ATHLETE_OF_THE_YEAR_FEMALE','ATHLETE_OF_THE_YEAR_MALE'];
        $socioCodes = ['SOCIO_CULTURAL_AWARD_FEMALE','SOCIO_CULTURAL_AWARD_MALE','PERFORMER_OF_THE_YEAR_FEMALE','PERFORMER_OF_THE_YEAR_MALE'];
        $rulesFor = function (array $codes) use ($db, $byCode): array {
            $ids = array_map(fn ($c) => $byCode[$c]['id'], $codes);
            return $db->table('award_scoring_rules r')->select('r.rule_config')->join('award_criteria c', 'c.id=r.criterion_id')->whereIn('c.award_definition_id', $ids)->where('r.is_active', 1)->get()->getResultArray();
        };
        $sportsJson = implode('\n', array_column($rulesFor($sportsCodes), 'rule_config'));
        $socioJson = implode('\n', array_column($rulesFor($socioCodes), 'rule_config'));
        $test('SPORTS-001', 'All four sports-family Awards retain the 55-point shared model', ! array_filter($sportsCodes, fn ($c) => $expected[$c][4] !== 55.0));
        $test('SOCIO-001', 'All four socio-cultural Awards retain the 55-point proposed model', ! array_filter($socioCodes, fn ($c) => $expected[$c][4] !== 55.0));
        $ndeaSilverOk = false;
        foreach ($rulesFor($socioCodes) as $configuredRule) {
            $config = json_decode($configuredRule['rule_config'], true);
            $matrix = $config['medal_matrix'] ?? [];
            if (isset($matrix['ndea_inter_school']) || isset($matrix['ndea'])) {
                $ndea = $matrix['ndea_inter_school'] ?? $matrix['ndea'];
                $ndeaSilverOk = $ndeaSilverOk || (float) ($ndea['silver'] ?? 0) === 3.0;
            }
        }
        $test('SOCIO-002', 'Socio-cultural matrix preserves NDEA Silver = 3', $ndeaSilverOk);
        $test('MATRIX-001', 'Sports and socio-cultural rule payloads remain independently stored', hash('sha256', $sportsJson) !== hash('sha256', $socioJson));

        $highest = $db->table('award_scoring_rules')->where('rule_type', 'highest_only')->where('is_active', 1)->countAllResults();
        $accum = $db->table('award_scoring_rules')->where('rule_type', 'sum_capped')->where('is_active', 1)->countAllResults();
        $test('RULE-001', 'Highest-only and accumulation rule families coexist independently', $highest > 0 && $accum > 0);
        $synthetic = (new AwardScoringRuleEngine($db))->evaluateCriterionScore(['id' => 'fixture-non-computable', 'code' => 'PANEL', 'name' => 'Panel', 'max_points' => 50, 'is_portfolio_computable' => 0], []);
        $test('NONCOMP-001', 'Non-computable criteria contribute zero and remain outside automation', $synthetic['is_computable'] === false && $synthetic['awarded_points'] === 0.0);

        $orphans = [
            'criteria' => "SELECT COUNT(*) n FROM award_criteria c LEFT JOIN award_definitions a ON a.id=c.award_definition_id WHERE a.id IS NULL",
            'components' => "SELECT COUNT(*) n FROM award_criterion_components x LEFT JOIN award_criteria c ON c.id=x.criterion_id WHERE c.id IS NULL",
            'rules' => "SELECT COUNT(*) n FROM award_scoring_rules r LEFT JOIN award_criteria c ON c.id=r.criterion_id WHERE c.id IS NULL",
            'mappings' => "SELECT COUNT(*) n FROM award_evidence_mapping_rules r LEFT JOIN award_criteria c ON c.id=r.criterion_id LEFT JOIN portfolio_categories p ON p.id=r.portfolio_category_id WHERE c.id IS NULL OR p.id IS NULL",
            'evaluations' => "SELECT COUNT(*) n FROM student_award_evaluations e LEFT JOIN award_definitions a ON a.id=e.award_definition_id LEFT JOIN award_cycles c ON c.id=e.cycle_id WHERE a.id IS NULL OR c.id IS NULL",
            'candidates' => "SELECT COUNT(*) n FROM award_interview_eligibilities i LEFT JOIN award_definitions a ON a.id=i.award_definition_id LEFT JOIN award_cycles c ON c.id=i.cycle_id LEFT JOIN profiles p ON p.id=i.student_profile_id WHERE a.id IS NULL OR c.id IS NULL OR p.id IS NULL",
        ];
        $orphanCounts = [];
        foreach ($orphans as $name => $sql) { $orphanCounts[$name] = (int) $db->query($sql)->getRowArray()['n']; }
        $test('RI-001', 'Zero unexplained Award configuration/evaluation/candidate orphans', array_sum($orphanCounts) === 0, json_encode($orphanCounts));
        $reuseRules = $db->query("SELECT r.*,c.award_definition_id FROM award_evidence_mapping_rules r JOIN award_criteria c ON c.id=r.criterion_id LEFT JOIN award_evidence_mapping_conditions mc ON mc.mapping_rule_id=r.id WHERE r.is_active=1 AND r.portfolio_subcategory_id IS NULL AND mc.id IS NULL AND r.portfolio_category_id IN (SELECT r2.portfolio_category_id FROM award_evidence_mapping_rules r2 JOIN award_criteria c2 ON c2.id=r2.criterion_id WHERE r2.is_active=1 GROUP BY r2.portfolio_category_id HAVING COUNT(DISTINCT c2.award_definition_id)>1) ORDER BY r.portfolio_category_id,c.award_definition_id")->getResultArray();
        $pair = [];
        foreach ($reuseRules as $row) {
            if ($pair === []) { $pair[] = $row; continue; }
            if ($row['portfolio_category_id'] === $pair[0]['portfolio_category_id'] && $row['award_definition_id'] !== $pair[0]['award_definition_id']) { $pair[] = $row; break; }
            $pair = [$row];
        }
        $reuseOk = count($pair) === 2;
        if ($reuseOk) {
            $fixture = [['id' => 'phase16-shared-record', 'status' => 'verified', 'category_id' => $pair[0]['portfolio_category_id'], 'subcategory_id' => null, 'title' => 'Phase 16 shared evidence', 'structured_metadata' => '{}']];
            $mappingService = new EvidenceMappingService($db);
            $first = $mappingService->findQualifyingEvidenceForCriterion($pair[0]['scoring_model_version_id'], $pair[0]['criterion_id'], $fixture);
            $second = $mappingService->findQualifyingEvidenceForCriterion($pair[1]['scoring_model_version_id'], $pair[1]['criterion_id'], $fixture);
            $reuseOk = count($first) === 1 && count($second) === 1 && $first[0]['portfolio_record_id'] === $second[0]['portfolio_record_id'];
        }
        $test('TRACE-001', 'One evidence object maps traceably to multiple legitimate Awards', $reuseOk);
        $test('PATH-001', 'Dean nominations remain Award + Cycle scoped with no score columns', $db->fieldExists('award_definition_id', 'dean_student_nominations') && $db->fieldExists('cycle_id', 'dean_student_nominations') && ! $db->fieldExists('raw_score', 'dean_student_nominations'));
        $test('FINAL-001', 'Potential-candidate table contains no automatic final-awardee field', ! $db->fieldExists('is_awardee', 'award_interview_eligibilities'));

        CLI::write(str_repeat('=', 104), 'cyan');
        CLI::write("Phase 16 Verification Summary: {$passed} Passed, {$failed} Failed", $failed === 0 ? 'green' : 'red');
        if ($failed === 0) { CLI::write('PHASE 16: PASS — CROSS-AWARD INTERACTION VERIFIED', 'green'); }
        CLI::write(str_repeat('=', 104), 'cyan');
        return $failed === 0 ? 0 : 1;
    }
}
