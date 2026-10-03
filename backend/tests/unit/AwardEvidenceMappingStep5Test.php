<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 5: no wrong-criterion fallback, no placeholder criterion ids, duplicate guard per
 * (criterion, component, source activity).
 */
final class AwardEvidenceMappingStep5Test extends CIUnitTestCase
{
    private function service(): AwardEvidenceMappingService
    {
        $eligible = new class () extends AwardEligibilityService {
            public function __construct()
            {
            }

            public function evaluateStudentEligibility($award, $student): array
            {
                return ['eligible' => true];
            }
        };

        // A non-query-builder db object: criteria come from the award array, records are passed in.
        return new AwardEvidenceMappingService(new \stdClass(), $eligible);
    }

    private function record(string $id, string $category, array $metadata, string $sub = '', ?string $source = null): array
    {
        return array_filter([
            'id' => $id, 'title' => 'same title', 'status' => 'verified', 'category_code' => $category,
            'subcategory_code' => $sub, 'structured_metadata' => $metadata, 'source_record_id' => $source,
        ], static fn($v) => $v !== null);
    }

    public function testUnmatchedRecordDoesNotFallBackToFirstCriterion(): void
    {
        $award = ['id' => 'a', 'code' => 'LEADERSHIP_AWARD', 'criteria' => [['id' => 'c-community', 'code' => 'CRIT_LEAD_COMMUNITY', 'max_points' => 20]]];
        $package = $this->service()->mapStudentEvidenceForAward($award, ['id' => 's'], [
            $this->record('r1', 'CITATION_RECOGNITION', ['scope' => 'LOCAL']),
        ]);

        self::assertSame(0, $package['relevant_verified_record_count']);
        self::assertSame(AwardEvidenceMappingService::REASON_CATEGORY_NOT_RELEVANT, $package['excluded_records'][0]['reason']);
        self::assertSame([], $package['criteria'][0]['evidence']);
    }

    public function testNoPlaceholderCriterionIdsInSource(): void
    {
        $source = (string) file_get_contents(dirname(__DIR__, 2) . '/app/Services/AwardEvidenceMappingService.php');
        self::assertDoesNotMatchRegularExpression("/'crit-[a-z-]+'/", $source);
        self::assertStringNotContainsString('CRIT_DEFAULT', $source);
        self::assertStringNotContainsString('\\mysqli', $source);
    }

    public function testDuplicateGuardIsPerCriterionComponentAndSource(): void
    {
        $award = ['id' => 'a', 'code' => 'SPORTS_AWARD_MALE', 'criteria' => [
            ['id' => 'c-skills', 'code' => 'CRIT_SPORTS_M_SKILLS_ATTITUDE', 'max_points' => 20],
            ['id' => 'c-part', 'code' => 'CRIT_SPORTS_M_PARTICIPATION', 'max_points' => 20],
            ['id' => 'c-awards', 'code' => 'CRIT_SPORTS_M_AWARDS', 'max_points' => 15],
        ]];
        $package = $this->service()->mapStudentEvidenceForAward($award, ['id' => 's'], [
            // Same source activity: the first only matches skills, the second adds participation.
            $this->record('r1', 'SPORTS', ['competition_type' => 'TEAM'], '', 'activity-1'),
            $this->record('r2', 'SPORTS', ['competition_type' => 'TEAM', 'event_level' => 'NDEA'], '', 'activity-1'),
            // Same title but a different record: not a duplicate.
            $this->record('r3', 'SPORTS', ['competition_type' => 'TEAM']),
        ]);

        $byCriterion = [];
        foreach ($package['criteria'] as $criterion) {
            $byCriterion[$criterion['criterion_id']] = array_column($criterion['evidence'], 'record_id');
        }
        self::assertSame(['r1', 'r3'], $byCriterion['c-skills']);
        self::assertSame(['r2'], $byCriterion['c-part']);
        self::assertSame([], $byCriterion['c-awards']);
        self::assertSame([], $package['excluded_records']);
    }
}
