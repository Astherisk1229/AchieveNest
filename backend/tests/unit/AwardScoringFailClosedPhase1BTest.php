<?php

namespace Tests\Unit;

use App\Services\AwardScoringService;
use App\Services\AwardEvidenceMappingService;
use CodeIgniter\Test\CIUnitTestCase;

final class AwardScoringFailClosedPhase1BTest extends CIUnitTestCase
{
    private AwardScoringService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $reflection = new \ReflectionClass(AwardScoringService::class);
        $this->service = $reflection->newInstanceWithoutConstructor();
    }

    private function criterion(string $code, array $evidence, float $max = 20.0): array
    {
        return ['criterion_code' => $code, 'criterion_name' => $code, 'max_points' => $max, 'evidence' => $evidence];
    }

    private function evidence(string $id, array $metadata = [], string $category = 'SPORTS', string $subcategory = ''): array
    {
        return ['record_id' => $id, 'title' => $id, 'category_code' => $category, 'subcategory_code' => $subcategory, 'structured_metadata' => $metadata];
    }

    public function testMissingAndUnknownSportsMetadataFailClosed(): void
    {
        $missing = $this->service->scoreCriterion('SPORTS_AWARD_MALE', $this->criterion('SPORTS_AWARDS', [$this->evidence('a')], 15));
        $unknown = $this->service->scoreCriterion('SPORTS_AWARD_MALE', $this->criterion('SPORTS_PARTICIPATION', [$this->evidence('b', ['event_level' => 'UNKNOWN'])]));
        $recognized = $this->service->scoreCriterion('SPORTS_AWARD_MALE', $this->criterion('SPORTS_AWARDS', [$this->evidence('c', ['event_level' => 'PRISAA NATIONAL', 'placement' => 'GOLD'])], 15));

        $this->assertSame(0.0, $missing['earned_points']);
        $this->assertSame(0.0, $unknown['earned_points']);
        $this->assertSame(7.0, $recognized['earned_points']);
    }

    public function testMissingPublicationTypeIsNotMappedToNews(): void
    {
        $reflection = new \ReflectionClass(AwardEvidenceMappingService::class);
        $mapping = $reflection->newInstanceWithoutConstructor();
        $result = $mapping->evaluateRecordRelevanceForAward('CAMPUS_JOURNALISM_AWARD', [
            'category_code' => 'CAMPUS_JOURNALISM',
            'structured_metadata' => [],
        ], [['id' => 'publication', 'code' => 'PUBLICATION']]);

        $this->assertFalse($result['relevant']);
        $this->assertSame('METADATA_UNSCORABLE', $result['reason']);
    }

    public function testMemberAndVolunteerLeadershipAreDistinctAdditiveAndCapped(): void
    {
        $evidence = [
            $this->evidence('ssg', ['position_level' => 'officer'], 'LEADERSHIP_POSITION', 'SSG_UNIVERSITY_GOVERNMENT'),
            $this->evidence('club', ['position_level' => 'officer'], 'LEADERSHIP_POSITION', 'CLUB_ORGANIZATION'),
            $this->evidence('club', ['position_level' => 'officer'], 'LEADERSHIP_POSITION', 'CLUB_ORGANIZATION'),
        ];
        foreach (['MEMBER_OF_THE_YEAR', 'VOLUNTEER_OF_THE_YEAR'] as $award) {
            $result = $this->service->scoreCriterion($award, $this->criterion('LEADERSHIP', $evidence, 10));
            $this->assertSame(5.0, $result['components'][0]['earned_points']);
        }
    }

    public function testOrdinaryVolunteerParticipationDoesNotScoreAsInitiatedActivity(): void
    {
        $ordinary = $this->evidence('ordinary', ['involvement_type' => 'CHURCH', 'role' => 'VOLUNTEER'], 'CHURCH_MINISTRY_INVOLVEMENT');
        $result = $this->service->scoreCriterion('VOLUNTEER_OF_THE_YEAR', $this->criterion('VOLUNTEERISM', [$ordinary], 40));

        $this->assertSame(5.0, $result['components'][0]['earned_points']);
        $this->assertSame(0.0, $result['components'][1]['earned_points']);
    }

    public function testExplicitInitiatorScoresAndInitiatedActivityCapIsEnforced(): void
    {
        $records = [];
        $scopes = ['SCHOOL', 'COMMUNITY', 'CHURCH', 'CHURCH'];
        foreach ($scopes as $index => $scope) {
            $records[] = $this->evidence('initiative-' . $index, [
                'scope' => $scope,
                'role' => 'PRINCIPAL ORGANIZER',
                'involvement_type' => $scope,
            ], 'COMMUNITY_SERVICE_VOLUNTEERISM');
        }
        $result = $this->service->scoreCriterion('VOLUNTEER_OF_THE_YEAR', $this->criterion('VOLUNTEERISM', $records, 40));

        $this->assertSame(15.0, $result['components'][1]['earned_points']);
    }

    public function testUnresolvedLeadershipAwardScopeIsUnscorableWithWarning(): void
    {
        $evidence = $this->evidence('national', ['scope' => 'NATIONAL'], 'CITATION_RECOGNITION');
        $result = $this->service->scoreCriterion('MEMBER_OF_THE_YEAR', $this->criterion('LEADERSHIP', [$evidence], 10));
        $awards = $result['components'][1];

        $this->assertSame(0.0, $awards['earned_points']);
        $this->assertSame('FAIL_CLOSED', $awards['evidence_trace'][0]['rule_type']);
        $this->assertArrayHasKey('scoring_warning', $awards['evidence_trace'][0]);
    }
}
