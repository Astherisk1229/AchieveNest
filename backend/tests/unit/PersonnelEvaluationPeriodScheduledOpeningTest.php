<?php

declare(strict_types=1);

use App\Services\PersonnelEvaluationPeriodService;
use Config\Database as DatabaseConfig;
use PHPUnit\Framework\TestCase;

final class PersonnelEvaluationPeriodScheduledOpeningTest extends TestCase
{
    public function testDueDraftPeriodsAreOpenedWhileFutureAndExpiredDraftsRemainClosed(): void
    {
        $db = DatabaseConfig::connect([
            'DSN' => '', 'hostname' => '', 'username' => '', 'password' => '',
            'database' => ':memory:', 'DBDriver' => 'SQLite3', 'DBPrefix' => 'scheduled_test_', 'pConnect' => false, 'DBDebug' => true,
        ]);
        $db->query('CREATE TABLE scheduled_test_personnel_evaluation_periods (
            id TEXT PRIMARY KEY, created_by TEXT, evaluation_type TEXT, personnel_group TEXT,
            status TEXT, submission_open_at TEXT, submission_close_at TEXT, evaluation_start_at TEXT, evaluation_end_at TEXT
        )');
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Manila'));
        $db->table('personnel_evaluation_periods')->insertBatch([
            ['id'=>'due-faculty', 'created_by'=>'hr-1', 'evaluation_type'=>'RANKING_PROMOTION', 'personnel_group'=>'FACULTY', 'status'=>'DRAFT', 'submission_open_at'=>$now->modify('-60 seconds')->format('Y-m-d H:i:s'), 'submission_close_at'=>$now->modify('+3600 seconds')->format('Y-m-d H:i:s')],
            ['id'=>'future-faculty', 'created_by'=>'hr-1', 'evaluation_type'=>'RANKING_PROMOTION', 'personnel_group'=>'FACULTY', 'status'=>'DRAFT', 'submission_open_at'=>$now->modify('+3600 seconds')->format('Y-m-d H:i:s'), 'submission_close_at'=>$now->modify('+7200 seconds')->format('Y-m-d H:i:s')],
            ['id'=>'expired-faculty', 'created_by'=>'hr-1', 'evaluation_type'=>'RANKING_PROMOTION', 'personnel_group'=>'FACULTY', 'status'=>'DRAFT', 'submission_open_at'=>$now->modify('-7200 seconds')->format('Y-m-d H:i:s'), 'submission_close_at'=>$now->modify('-3600 seconds')->format('Y-m-d H:i:s')],
            ['id'=>'due-ntp', 'created_by'=>'hr-1', 'evaluation_type'=>'RANKING_PROMOTION', 'personnel_group'=>'NON_TEACHING_FACULTY', 'status'=>'DRAFT', 'submission_open_at'=>$now->modify('-60 seconds')->format('Y-m-d H:i:s'), 'submission_close_at'=>$now->modify('+3600 seconds')->format('Y-m-d H:i:s')],
            ['id'=>'expired-evaluation-faculty', 'created_by'=>'hr-1', 'evaluation_type'=>'RANKING_PROMOTION', 'personnel_group'=>'FACULTY', 'status'=>'EVALUATION_ONGOING', 'evaluation_end_at'=>$now->modify('-60 seconds')->format('Y-m-d H:i:s')],
        ]);

        $service = new class($db) extends PersonnelEvaluationPeriodService {
            public array $transitions = [];
            public function transition(string $id, string $action, string $actorId, ?string $requestId = null, ?int $expectedVersion = null, ?string $reason = null): array
            {
                $this->transitions[] = compact('id', 'action', 'actorId', 'requestId');
                return ['status' => 'OPEN_FOR_SUBMISSION'];
            }
        };

        self::assertSame(1, $service->openDueScheduledSubmissions('FACULTY'));
        self::assertSame(['due-faculty', 'expired-evaluation-faculty'], array_column($service->transitions, 'id'));
        self::assertSame('open-submissions', $service->transitions[0]['action']);
        self::assertStringStartsWith('scheduled-open:due-faculty:', $service->transitions[0]['requestId']);
        self::assertSame('close', $service->transitions[1]['action']);
        self::assertSame('scheduled-evaluation-close:expired-evaluation-faculty', $service->transitions[1]['requestId']);
        $db->close();
    }
}
