<?php

namespace Tests\Unit;

use App\Services\AwardApiContractService;
use CodeIgniter\Test\CIUnitTestCase;

final class AwardCriteriaContractCompletionPhase3BTest extends CIUnitTestCase
{
    private function component(array $config, string $ruleType = 'sum_capped', float $maximum = 10.0): array
    {
        return AwardApiContractService::criterionComponent([
            'id' => 'component-id',
            'code' => 'COMPONENT',
            'name' => 'Component',
            'max_points' => $maximum,
            'is_computable' => 1,
        ], [
            'rule_type' => $ruleType,
            'rule_config' => json_encode($config, JSON_THROW_ON_ERROR),
            'max_points' => $maximum,
        ]);
    }

    public function testCountConfigurationNormalizesWithoutExposingSumCapped(): void
    {
        $criterion = $this->component(['points_per_item' => 2, 'cap' => 10, 'max_points' => 10]);

        $this->assertSame('COUNT', $criterion['criterion_type']);
        $this->assertSame('ADD_UNTIL_CAP', $criterion['aggregation_mode']);
        $this->assertSame(5.0, $criterion['cap']);
        $this->assertSame(['count_min' => 5, 'points' => 10.0], $criterion['point_mapping'][5]);
        $this->assertSame('AVAILABLE', $criterion['field_availability']['point_mapping']['status']);
    }

    public function testHighestAndAdditiveConfigurationsHaveExplicitMappings(): void
    {
        $highest = $this->component(['points_matrix' => ['university' => 10, 'college' => 8]], 'highest_only');
        $additive = $this->component(['points_per_record' => ['award_international' => 5, 'award_local' => 3], 'cap' => 10]);

        $this->assertSame('HIGHEST_VALUE', $highest['criterion_type']);
        $this->assertSame('HIGHEST_ONLY', $highest['aggregation_mode']);
        $this->assertSame('UNIVERSITY', $highest['point_mapping'][0]['value']);
        $this->assertSame('ADDITIVE', $additive['criterion_type']);
        $this->assertSame('ADD_DISTINCT_UNTIL_CAP', $additive['aggregation_mode']);
        $this->assertSame(5.0, $additive['point_mapping'][0]['points']);
    }

    public function testPresenceConfigurationIsOnceOnly(): void
    {
        $criterion = $this->component(['presence_points' => 10, 'cap' => 10]);

        $this->assertSame('PRESENCE', $criterion['criterion_type']);
        $this->assertSame('ONCE', $criterion['aggregation_mode']);
        $this->assertSame(['qualified' => 10.0, 'not_qualified' => 0.0], $criterion['point_mapping']);

        $legacyPersistedKey = $this->component(['fixed_presence_points' => 10, 'cap' => 10]);
        $this->assertSame('PRESENCE', $legacyPersistedKey['criterion_type']);
        $this->assertSame($criterion['point_mapping'], $legacyPersistedKey['point_mapping']);
    }

    public function testMedalConfigurationProducesTrueMatrix(): void
    {
        $criterion = $this->component([
            'medal_matrix' => [
                'prisaa_national' => ['gold' => 7, 'silver' => 5, 'bronze' => 3],
                'prisaa_regional' => ['gold' => 5, 'silver' => 3, 'bronze' => 2],
            ],
            'cap' => 15,
        ], 'sum_capped', 15);

        $this->assertSame('MATRIX', $criterion['criterion_type']);
        $this->assertSame(['gold', 'silver', 'bronze'], $criterion['point_mapping']['rows']);
        $this->assertSame(['prisaa_national', 'prisaa_regional'], $criterion['point_mapping']['columns']);
        $this->assertSame([7, 5], $criterion['point_mapping']['values'][0]);
    }

    public function testHumanOnlyAndUnconfiguredRulesHaveDeterministicAvailability(): void
    {
        $human = AwardApiContractService::criterion(['id' => 'human', 'name' => 'Interview', 'is_portfolio_computable' => 0]);
        $unconfigured = AwardApiContractService::criterion(['id' => 'unknown', 'name' => 'Unknown', 'is_portfolio_computable' => 1]);

        $this->assertSame('HUMAN_ONLY', $human['criterion_type']);
        $this->assertSame('HUMAN_ONLY', $human['field_availability']['point_mapping']['reason']);
        $this->assertNull($unconfigured['criterion_type']);
        $this->assertSame('NOT_CONFIGURED', $unconfigured['field_availability']['point_mapping']['reason']);
    }

    public function testAwardPublishesServerCalculatedRawQualifyingScore(): void
    {
        $award = AwardApiContractService::award([
            'authority_status' => 'OFFICIAL',
            'candidate_threshold_percent' => 80,
            'computable_max_score' => 70,
        ]);

        $this->assertSame(56.0, $award['raw_qualifying_score']);
        $this->assertSame('AVAILABLE', $award['field_availability']['raw_qualifying_score']['status']);
    }

    public function testUnresolvedMappingAndProposedAuthorityRemainFailClosed(): void
    {
        $unresolved = AwardApiContractService::criterion([
            'id' => 'leadership-awards',
            'rule_type' => 'highest_only',
            'scoring_warnings' => [['code' => 'UNRESOLVED_LEADERSHIP_SCOPE', 'message' => 'Regional/National values are unresolved.']],
        ]);
        $proposed = AwardApiContractService::award([
            'authority_status' => 'PROPOSED',
            'candidate_threshold_percent' => 80,
        ]);

        $this->assertSame('UNAVAILABLE', $unresolved['field_availability']['point_mapping']['status']);
        $this->assertSame('SOURCE_UNRESOLVED', $unresolved['field_availability']['point_mapping']['reason']);
        $this->assertSame('PARTIALLY_UNSCORABLE', $unresolved['scoring_status']);
        $this->assertSame('AWARD_AUTHORITY_PENDING', $proposed['configuration_status']);
        $this->assertSame('AUTHORITY_PENDING', $proposed['field_availability']['raw_qualifying_score']['reason']);
    }

    public function testCanonicalLeadershipRulePublishesUnresolvedScopesWithoutValues(): void
    {
        $criterion = AwardApiContractService::criterionComponent([
            'id' => 'leadership-awards',
            'name' => 'Awards',
            'max_points' => 10,
        ], [
            'code' => 'RULE_LEAD_AWARDS',
            'rule_type' => 'sum_capped',
            'rule_config' => json_encode([
                'points_per_record' => ['award_international' => 5, 'award_local' => 3, 'seminar' => 2],
                'cap' => 10,
            ], JSON_THROW_ON_ERROR),
        ]);

        $this->assertSame('ADDITIVE', $criterion['criterion_type']);
        $this->assertSame('PARTIALLY_UNSCORABLE', $criterion['scoring_status']);
        $this->assertSame(['AWARD_REGIONAL', 'AWARD_NATIONAL'], $criterion['unresolved_mappings']);
        $this->assertSame('UNRESOLVED_LEADERSHIP_SCOPE', $criterion['scoring_warnings'][0]['code']);
        $this->assertSame('AVAILABLE', $criterion['field_availability']['unresolved_mappings']['status']);
    }

    public function testMajorCriterionWithTypedComponentsHasNormalizedParentType(): void
    {
        $criterion = AwardApiContractService::criterion([
            'id' => 'major',
            'name' => 'Major criterion',
            'max_points' => 20,
            'components' => [
                ['criterion_id' => 'a', 'criterion_name' => 'A', 'criterion_type' => 'COUNT', 'max_points' => 10],
                ['criterion_id' => 'b', 'criterion_name' => 'B', 'criterion_type' => 'ADDITIVE', 'max_points' => 10],
            ],
        ]);

        $this->assertSame('ADDITIVE', $criterion['criterion_type']);
        $this->assertSame('ADD_COMPONENTS_UNTIL_CAP', $criterion['aggregation_mode']);
        $this->assertSame(20.0, $criterion['cap']);
        $this->assertCount(2, $criterion['point_mapping']);
    }
}
