<?php
namespace Tests\Isolated;

use App\Controllers\Api\TargetHRPersonnelController;
use App\Services\PersonnelClassificationService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use ReflectionClass;

/** HR Personnel Directory headcount summary (Total / Faculty / Non-Teaching). SQLite :memory:. */
final class PersonnelDirectorySummaryTest extends CIUnitTestCase
{
    public function testSummaryCountsEveryPersonnelByResolvedGroup(): void
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $db->query('CREATE TABLE profiles (id TEXT PRIMARY KEY, account_type TEXT, status TEXT)');
        $db->query('CREATE TABLE personnel_profiles (profile_id TEXT, personnel_group TEXT, personnel_classification TEXT, organizational_side TEXT)');
        $rows = [
            ['F1', 'active', 'faculty', null], ['F2', 'active', 'faculty', null], ['F3', 'archived', 'faculty', null],
            ['N1', 'active', 'non_teaching_faculty', null],
            ['L1', 'active', null, 'academic'],   // legacy classification -> Faculty via the resolver
            ['U1', 'active', null, null],         // unclassified
        ];
        foreach ($rows as [$id, $status, $group, $legacy]) {
            $db->table('profiles')->insert(['id' => $id, 'account_type' => 'personnel', 'status' => $status]);
            $db->table('personnel_profiles')->insert(['profile_id' => $id, 'personnel_group' => $group, 'personnel_classification' => $legacy]);
        }
        $db->table('profiles')->insert(['id' => 'S1', 'account_type' => 'student', 'status' => 'active']); // not personnel
        $db->table('personnel_profiles')->insert(['profile_id' => 'F1', 'personnel_group' => 'faculty']); // duplicate join row

        $controller = (new ReflectionClass(TargetHRPersonnelController::class))->newInstanceWithoutConstructor();
        (new \ReflectionProperty($controller, 'classificationService'))->setValue($controller, new PersonnelClassificationService());
        $summary = (new \ReflectionMethod($controller, 'directorySummary'))->invoke($controller, $db, true, true);

        self::assertSame(6, $summary['total_personnel']);
        self::assertSame(4, $summary['total_faculty']);
        self::assertSame(1, $summary['total_non_teaching']);
        self::assertSame(1, $summary['total_unclassified']);
        self::assertSame(1, $summary['total_archived']);
        $db->close();
    }
}
