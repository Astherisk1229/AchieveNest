<?php

namespace Tests\Unit;

use App\Services\RankingCycleService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** Workflow stage and lifecycle status are separate projections of the same authoritative track status. */
final class RankingCycleDisplayStatusTest extends TestCase
{
    private static function track(string $status, string $group = 'FACULTY', array $overrides = []): array
    {
        return $overrides + ['status' => $status, 'personnel_group' => $group, 'submission_open_at' => '2026-09-01 00:00:00', 'submission_close_at' => '2026-09-30 23:59:59', 'evaluation_start_at' => '2026-10-01 00:00:00', 'evaluation_end_at' => '2026-10-20 23:59:59', 'evaluation_scale_version_id' => 'ver-1'];
    }

    public function testCycleWithoutTracksIsIncompleteConfigurationNotANormalStage(): void
    {
        self::assertSame(['key' => 'INCOMPLETE', 'label' => 'Incomplete Configuration'], RankingCycleService::lifecycle([]));
        self::assertNull(RankingCycleService::currentStage([]));
        self::assertSame(['complete_setup', 'delete'], RankingCycleService::allowedActions('INCOMPLETE', 0));
    }

    public function testDraftTrackMissingScheduleIsIncomplete(): void
    {
        $tracks = [self::track('DRAFT', 'FACULTY', ['submission_open_at' => null])];
        self::assertSame('INCOMPLETE', RankingCycleService::lifecycle($tracks)['key']);
        self::assertSame(['Faculty schedule is incomplete.'], RankingCycleService::configurationIssues($tracks));
    }

    #[DataProvider('lifecycleCases')]
    public function testLifecycleStatus(array $statuses, string $expected): void
    {
        self::assertSame($expected, RankingCycleService::lifecycle(array_map(fn(string $s) => self::track($s), $statuses))['key']);
    }

    public static function lifecycleCases(): array
    {
        return [
            'all draft is upcoming' => [['DRAFT', 'DRAFT'], 'UPCOMING'],
            'any operational track is ongoing' => [['CLOSED', 'EVALUATION_ONGOING'], 'ONGOING'],
            'mixed draft and open is ongoing' => [['DRAFT', 'OPEN_FOR_SUBMISSION'], 'ONGOING'],
            'all terminal is completed' => [['CLOSED', 'ARCHIVED'], 'COMPLETED'],
            'all archived is archived' => [['ARCHIVED', 'ARCHIVED'], 'ARCHIVED'],
            'cancelled tracks are cancelled, not completed' => [['CANCELLED', 'CLOSED'], 'CANCELLED'],
            'cancelled cycle preserves archived tracks' => [['CANCELLED', 'ARCHIVED'], 'CANCELLED'],
        ];
    }

    #[DataProvider('stageCases')]
    public function testCurrentStageFollowsTheLeastAdvancedTrack(array $statuses, string $expected): void
    {
        self::assertSame($expected, RankingCycleService::currentStage(array_map(fn(string $s) => self::track($s), $statuses))['key']);
    }

    public static function stageCases(): array
    {
        return [
            [['DRAFT'], 'annual_reviews'],
            [['OPEN_FOR_SUBMISSION'], 'submissions'],
            [['SUBMISSION_CLOSED'], 'evaluation'],
            [['EVALUATION_ONGOING'], 'evaluation'],
            [['CLOSED'], 'results'],
            [['ARCHIVED'], 'results'],
            [['CANCELLED'], 'results'],
            [['CLOSED', 'OPEN_FOR_SUBMISSION'], 'submissions'],
        ];
    }

    public function testStatusAndStageAreIndependent(): void
    {
        $tracks = [self::track('EVALUATION_ONGOING')];
        self::assertSame('ONGOING', RankingCycleService::lifecycle($tracks)['key']);
        self::assertSame('Evaluation', RankingCycleService::currentStage($tracks)['label']);
    }

    public function testGeneratedNamesFollowCoverage(): void
    {
        self::assertSame('AY 2026–2027 Personnel Ranking', RankingCycleService::generatedName('2026-2027', ['NON_TEACHING_FACULTY', 'FACULTY']));
        self::assertSame('AY 2026–2027 Faculty Ranking', RankingCycleService::generatedName('2026-2027', ['FACULTY']));
        self::assertSame('AY 2026–2027 Non-Teaching Faculty Ranking', RankingCycleService::generatedName('2026-2027', ['NON_TEACHING_FACULTY']));
        self::assertSame('AY 2026–2027 Ranking Period', RankingCycleService::generatedName('2026-2027', []));
    }

    public function testCoverageInputAcceptsBothAndLists(): void
    {
        self::assertSame(['FACULTY', 'NON_TEACHING_FACULTY'], RankingCycleService::coverageGroups(['personnel_coverage' => 'BOTH']));
        self::assertSame(['NON_TEACHING_FACULTY'], RankingCycleService::coverageGroups(['personnel_groups' => ['non-teaching-faculty']]));
        $this->expectException(\InvalidArgumentException::class);
        RankingCycleService::coverageGroups(['personnel_coverage' => 'STUDENTS']);
    }

    public function testActionsFollowLifecycle(): void
    {
        self::assertContains('open', RankingCycleService::allowedActions('ONGOING', 2));
        self::assertContains('cancel', RankingCycleService::allowedActions('ONGOING', 2));
        self::assertContains('delete', RankingCycleService::allowedActions('UPCOMING', 2, true));
        self::assertSame(['view', 'archive'], RankingCycleService::allowedActions('COMPLETED', 2));
        self::assertSame(['view', 'restore'], RankingCycleService::allowedActions('ARCHIVED', 2));
        self::assertSame(['view'], RankingCycleService::allowedActions('CANCELLED', 2));
    }
}
