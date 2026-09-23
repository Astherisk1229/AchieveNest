<?php

namespace Tests\Unit;

use App\Services\AwardApiContractService;
use CodeIgniter\Test\CIUnitTestCase;

final class AwardApiAuthorityContractPhase1CTest extends CIUnitTestCase
{
    public function testOfficialAndOperationalizedAuthorityStatesAreStable(): void
    {
        $official = AwardApiContractService::award(['authority_status' => 'OFFICIAL', 'candidate_threshold_percent' => 80]);
        $operationalized = AwardApiContractService::award(['authority_status' => 'SYSTEM_OPERATIONALIZATION', 'candidate_threshold_percent' => 80]);

        $this->assertSame('OFFICIAL', $official['authority_status']);
        $this->assertSame('OPERATIONALIZED', $operationalized['authority_status']);
        $this->assertTrue($official['configuration_valid']);
    }

    public function testProposedAndMissingThresholdHaveExplicitInvalidStates(): void
    {
        $proposed = AwardApiContractService::award(['authority_status' => 'PROPOSED', 'candidate_threshold_percent' => 80]);
        $missing = AwardApiContractService::award(['authority_status' => 'OFFICIAL']);

        $this->assertSame('AWARD_AUTHORITY_PENDING', $proposed['configuration_status']);
        $this->assertFalse($proposed['configuration_valid']);
        $this->assertSame('THRESHOLD_CONFIGURATION_ERROR', $missing['configuration_status']);
        $this->assertSame('UNAVAILABLE', $missing['field_availability']['candidate_threshold_percent']['status']);
    }

    public function testScoreContractSuppliesAuthoritativeNormalizedAndQualifyingScores(): void
    {
        $score = AwardApiContractService::score([
            'raw_score' => 40,
            'max_computable_score' => 50,
            'candidate_threshold_percent' => 80,
            'candidate_status' => 'POTENTIAL_CANDIDATE',
            'scoring_status' => 'SCORED',
        ]);

        $this->assertSame(40.0, $score['raw_portfolio_score']);
        $this->assertSame(80.0, $score['portfolio_potential_score']);
        $this->assertSame(40.0, $score['raw_qualifying_score']);
        $this->assertSame('POTENTIAL_CANDIDATE_DISCOVERY', $score['threshold_purpose']);
        $this->assertSame('PORTFOLIO_THRESHOLD', $score['qualification_basis']);
    }

    public function testPartiallyUnscorableWarningHasStableShape(): void
    {
        $score = AwardApiContractService::score([
            'raw_portfolio_score' => 0,
            'computable_max_score' => 10,
            'candidate_threshold_percent' => 80,
            'scoring_status' => 'PARTIALLY_UNSCORABLE',
            'scoring_warnings' => [[
                'code' => 'UNRESOLVED_LEADERSHIP_SCOPE',
                'message' => 'Regional/National leadership award points are not defined.',
                'criterion_id' => 'criterion-1',
                'record_id' => 'evidence-1',
            ]],
        ]);

        $this->assertSame('PARTIALLY_UNSCORABLE', $score['configuration_status']);
        $this->assertSame([
            'code' => 'UNRESOLVED_LEADERSHIP_SCOPE',
            'severity' => 'warning',
            'message' => 'Regional/National leadership award points are not defined.',
            'criterion_id' => 'criterion-1',
            'evidence_id' => 'evidence-1',
        ], $score['scoring_warnings'][0]);
    }

    public function testMatrixAndHumanOnlyCriteriaAreNotFlattened(): void
    {
        $matrix = AwardApiContractService::criterion(['id' => 'matrix', 'code' => 'AWARDS', 'name' => 'Awards', 'rule_type' => 'LEVEL_RESULT_MATRIX', 'max_points' => 15]);
        $human = AwardApiContractService::criterion(['id' => 'interview', 'name' => 'Interview', 'max_points' => 10, 'is_portfolio_computable' => 0]);

        $this->assertSame('MATRIX', $matrix['criterion_type']);
        $this->assertNull($matrix['point_mapping']);
        $this->assertSame('HUMAN_ONLY', $human['criterion_type']);
        $this->assertTrue($human['human_only']);
    }

    public function testDiscoveryAndFullEvaluationThresholdsAreDistinct(): void
    {
        $award = AwardApiContractService::award(['code' => 'SMC_AWARD', 'authority_status' => 'OFFICIAL', 'candidate_threshold_percent' => 80]);

        $this->assertSame(80.0, $award['thresholds']['potential_candidate_discovery']['value']);
        $this->assertNull($award['thresholds']['full_evaluation']['value']);
        $this->assertSame('UNAVAILABLE', $award['thresholds']['full_evaluation']['availability']['status']);
    }

    public function testContractSourcesContainExplainabilityAndNoRankField(): void
    {
        $root = dirname(__DIR__, 2) . '/app';
        $review = file_get_contents($root . '/Services/AwardReviewService.php');
        $generation = file_get_contents($root . '/Services/AwardCandidateGenerationService.php');

        foreach (['achieved_points', 'calculation_text', 'aggregation_mode', 'verified_record_count', 'evidence_ids', 'human_only_criteria'] as $field) {
            $this->assertStringContainsString($field, $review);
        }
        $this->assertStringNotContainsString("'rank_position'", $generation);
        $this->assertStringNotContainsString('Top 3', $generation);
        $this->assertStringNotContainsString('Top 5', $generation);
    }
}
