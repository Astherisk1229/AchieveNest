<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\StudentAchievementFormSchemaRegistry;
use App\Services\StudentAchievementRecordSummaryService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

final class StudentAchievementRecordSummaryServiceTest extends CIUnitTestCase
{
    private function service(string $contractCode, string $categoryId, string $subcategoryId): StudentAchievementRecordSummaryService
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => '', 'DBDebug' => true], false);
        $db->query('CREATE TABLE achievement_contracts (domain TEXT, is_active INTEGER, legacy_category_id TEXT, legacy_subcategory_id TEXT, contract_code TEXT, display_name TEXT)');
        $schema = (new StudentAchievementFormSchemaRegistry())->get($contractCode);
        $db->table('achievement_contracts')->insert([
            'domain' => 'STUDENT',
            'is_active' => 1,
            'legacy_category_id' => $categoryId,
            'legacy_subcategory_id' => $subcategoryId,
            'contract_code' => $contractCode,
            'display_name' => $schema['label'],
        ]);
        return new StudentAchievementRecordSummaryService($db);
    }

    public function testLeadershipSummaryUsesPositionAsTitleAndGoverningBodyAsOrganizer(): void
    {
        $service = $this->service('S01-SSG', 'cat-leadership', 'sub-ssg');
        $summary = $service->derive('cat-leadership', 'sub-ssg', [
            'schema_version' => StudentAchievementFormSchemaRegistry::VERSION,
            'governing_body_name' => 'University Student Government',
            'position_held' => 'President',
            'academic_year_start' => 2025,
        ]);

        self::assertSame('President', $summary['title']);
        self::assertSame('University Student Government', $summary['organizer_or_body']);
        self::assertNull($summary['occurrence_date'], 'An academic year must not be fabricated into a calendar date.');
    }

    public function testConfiguredActivityDatesMapToLegacyDatesWithoutOverwritingExistingValues(): void
    {
        $service = $this->service('S04-INITIATED_CHURCH_RELATED_ACTIVITY', 'cat-ministry', 'sub-activity');
        $metadata = [
            'schema_version' => StudentAchievementFormSchemaRegistry::VERSION,
            'activity_initiative_title' => 'Community Outreach',
            'church_ministry_context_affiliation' => 'St. Mary Parish',
            'activity_start_date' => '2026-04-02',
            'activity_end_date' => '2026-04-03',
        ];
        $summary = $service->derive('cat-ministry', 'sub-activity', $metadata);

        self::assertSame('2026-04-02', $summary['occurrence_date']);
        self::assertSame('2026-04-02', $summary['start_date']);
        self::assertSame('2026-04-03', $summary['end_date']);
        self::assertSame(
            [],
            $service->missingLegacyColumns(['title' => 'Historic Title', 'organizer_or_body' => 'Historic Parish', 'occurrence_date' => '2020-01-02', 'start_date' => '2020-01-02', 'end_date' => '2020-01-03', 'description' => 'Historic details'], $summary)
        );
        self::assertSame(
            ['title' => 'Community Outreach', 'organizer_or_body' => 'St. Mary Parish', 'occurrence_date' => '2026-04-02', 'start_date' => '2026-04-02', 'end_date' => '2026-04-03'],
            $service->missingLegacyColumns(['title' => '', 'organizer_or_body' => '', 'occurrence_date' => '', 'start_date' => '', 'end_date' => '', 'description' => ''], $summary)
        );
    }
}
