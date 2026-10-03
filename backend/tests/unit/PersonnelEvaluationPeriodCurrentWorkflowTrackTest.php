<?php

namespace Tests\Unit;

use App\Services\PersonnelEvaluationPeriodService;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class PersonnelEvaluationPeriodCurrentWorkflowTrackTest extends TestCase
{
    private function service(array $rows): PersonnelEvaluationPeriodService
    {
        return new class($rows) extends PersonnelEvaluationPeriodService {
            public function __construct(private array $rows) {}
            public function list(array $filters = []): array
            {
                return array_values(array_filter($this->rows, static fn(array $row): bool =>
                    ($row['evaluation_type'] ?? null) === ($filters['evaluation_type'] ?? null)
                    && ($row['personnel_group'] ?? null) === ($filters['personnel_group'] ?? null)
                ));
            }
        };
    }

    public function testFacultyTrackNeverFallsThroughToNewerNonTeachingTrack(): void
    {
        $service = $this->service([
            ['id'=>'ntf-newer','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'NON_TEACHING_FACULTY','status'=>'EVALUATION_ONGOING'],
            ['id'=>'faculty','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'SUBMISSION_CLOSED'],
        ]);
        self::assertSame('faculty', $service->currentWorkflowTrack('FACULTY')['id']);
    }

    public function testLatestClosedTrackRemainsVisibleUntilHrOpensTheNextCycle(): void
    {
        $service = $this->service([
            ['id'=>'draft','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'DRAFT'],
            ['id'=>'closed','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'CLOSED'],
            ['id'=>'archived','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'ARCHIVED'],
        ]);
        self::assertSame('closed', $service->currentWorkflowTrack('FACULTY')['id']);
    }

    public function testDraftAndArchivedTracksDoNotBecomeTheDeanCurrentCycle(): void
    {
        $service = $this->service([
            ['id'=>'draft','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'DRAFT'],
            ['id'=>'archived','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'ARCHIVED'],
        ]);
        self::assertNull($service->currentWorkflowTrack('FACULTY'));
    }

    public function testMultipleOperationalFacultyTracksFailClosed(): void
    {
        $service = $this->service([
            ['id'=>'one','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'OPEN_FOR_SUBMISSION'],
            ['id'=>'two','evaluation_type'=>'RANKING_PROMOTION','personnel_group'=>'FACULTY','status'=>'EVALUATION_ONGOING'],
        ]);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('More than one operational ranking track');
        $service->currentWorkflowTrack('FACULTY');
    }

    public function testRejectsUnknownPersonnelGroup(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->service([])->currentWorkflowTrack('ALL');
    }
}
