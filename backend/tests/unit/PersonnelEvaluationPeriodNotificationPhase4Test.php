<?php

declare(strict_types=1);

use App\Services\PersonnelEvaluationPeriodService;
use Config\Database as DatabaseConfig;
use PHPUnit\Framework\TestCase;

final class PersonnelEvaluationPeriodNotificationPhase4Test extends TestCase
{
    public function testOpeningPeriodNotifiesOnlyActivePersonnelInItsResolvedGroup(): void
    {
        $db = DatabaseConfig::connect([
            'DSN'      => '',
            'hostname' => '',
            'username' => '',
            'password' => '',
            'database' => ':memory:',
            'DBDriver' => 'SQLite3',
            'DBPrefix' => '',
            'pConnect' => false,
            'DBDebug'  => true,
        ]);
        $db->query('CREATE TABLE notifications (
            id TEXT PRIMARY KEY,
            recipient_profile_id TEXT,
            actor_profile_id TEXT,
            notification_type TEXT,
            title TEXT,
            message TEXT,
            reference_type TEXT,
            reference_id TEXT,
            idempotency_key TEXT,
            is_mandatory INTEGER,
            created_at TEXT
        )');
        $db->query('CREATE TABLE profiles (id TEXT PRIMARY KEY, account_type TEXT, status TEXT)');
        $db->query('CREATE TABLE personnel_profiles (
            profile_id TEXT PRIMARY KEY,
            personnel_group TEXT,
            personnel_classification TEXT,
            organizational_side TEXT
        )');
        $db->table('profiles')->insertBatch([
            ['id' => 'FACULTY-1', 'account_type' => 'personnel', 'status' => 'active'],
            ['id' => 'TEACHING-LEGACY', 'account_type' => 'personnel', 'status' => 'active'],
            ['id' => 'NON-TEACHING-1', 'account_type' => 'personnel', 'status' => 'active'],
            ['id' => 'INACTIVE-FACULTY', 'account_type' => 'personnel', 'status' => 'inactive'],
            ['id' => 'STUDENT-1', 'account_type' => 'student', 'status' => 'active'],
        ]);
        $db->table('personnel_profiles')->insertBatch([
            ['profile_id' => 'FACULTY-1', 'personnel_group' => 'faculty', 'personnel_classification' => 'academic', 'organizational_side' => 'academic'],
            ['profile_id' => 'TEACHING-LEGACY', 'personnel_group' => 'teaching_faculty', 'personnel_classification' => null, 'organizational_side' => 'academic'],
            ['profile_id' => 'NON-TEACHING-1', 'personnel_group' => 'non_teaching_faculty', 'personnel_classification' => 'non_academic', 'organizational_side' => 'non_academic'],
        ]);

        $service = new PersonnelEvaluationPeriodService($db);
        $method = new ReflectionMethod(PersonnelEvaluationPeriodService::class, 'notifyPeriodOpened');
        $method->setAccessible(true);
        $method->invoke($service, [
            'id' => 'PERIOD-1',
            'period_name' => '2026–2028 Personnel Ranking and Promotion Evaluation',
            'personnel_group' => 'FACULTY',
            'submission_close_at' => '2026-12-31 23:59:59',
        ], 'HR-1', 'request-phase4-1');

        $notifications = $db->table('notifications')->orderBy('recipient_profile_id')->get()->getResultArray();
        self::assertSame(['FACULTY-1', 'TEACHING-LEGACY'], array_column($notifications, 'recipient_profile_id'));
        self::assertSame(['personnel_evaluation_period', 'personnel_evaluation_period'], array_column($notifications, 'reference_type'));
        self::assertSame(['PERIOD-1', 'PERIOD-1'], array_column($notifications, 'reference_id'));
        self::assertSame(['Portfolio Submission is Now Open', 'Portfolio Submission is Now Open'], array_column($notifications, 'title'));
        $db->close();
    }
}
