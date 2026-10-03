<?php
namespace Tests\Isolated;

use App\Services\CanonicalStudentAchievementDraftService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

final class CanonicalDraftIsolationTest extends CIUnitTestCase
{
    public function testExistingFieldUpdatePreservesOtherOwnersFieldsAndVersions(): void
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => '', 'DBDebug' => true], false);
        foreach ([
            'achievement_records (id TEXT PRIMARY KEY, owner_profile_id TEXT, owner_domain TEXT, current_version_id TEXT, canonical_status TEXT, created_by_profile_id TEXT, created_at TEXT, updated_at TEXT)',
            'achievement_record_versions (id TEXT PRIMARY KEY, achievement_record_id TEXT, version_number INTEGER, previous_version_id TEXT, contract_code TEXT, submission_state TEXT, source_type TEXT, created_by_profile_id TEXT, revision_token INTEGER, created_at TEXT)',
            'achievement_version_draft_fields (record_version_id TEXT, field_key TEXT, field_value TEXT, updated_by_profile_id TEXT, PRIMARY KEY (record_version_id, field_key))',
            'achievement_contracts (contract_code TEXT, domain TEXT, is_active INTEGER, category_code TEXT, subcategory_code TEXT)',
            'student_leadership_position_details (record_version_id TEXT, governing_body_name TEXT, position_held TEXT, academic_year_start INTEGER)',
            'achievement_version_evidence (record_version_id TEXT, evidence_id TEXT)',
            'achievement_evidence (id TEXT, original_filename TEXT, mime_type TEXT, detected_mime_type TEXT, byte_size INTEGER, security_status TEXT, status TEXT)',
        ] as $schema) {
            $db->query('CREATE TABLE ' . $schema);
        }
        $db->table('achievement_contracts')->insert(['contract_code' => 'TEST_LEADERSHIP', 'domain' => 'STUDENT', 'is_active' => 1, 'category_code' => 'LEADERSHIP_POSITION', 'subcategory_code' => 'TEST']);
        $service = new CanonicalStudentAchievementDraftService($db);
        $a = $service->create('owner-a');
        $b = $service->create('owner-b');
        foreach ([['owner-a', $a], ['owner-b', $b]] as [$owner, $draft]) {
            $service->save($owner, $draft['achievement_record_id'], 'TEST_LEADERSHIP', ['governing_body_name' => $owner . '-body', 'position_held' => $owner . '-position']);
        }
        $db->table('achievement_version_draft_fields')->insert(['record_version_id' => 'historical-version', 'field_key' => 'position_held', 'field_value' => '"historical"', 'updated_by_profile_id' => 'owner-a']);
        $snapshot = fn () => $db->table('achievement_version_draft_fields')->orderBy('record_version_id')->orderBy('field_key')->get()->getResultArray();
        $expected = $snapshot();
        $service->save('owner-a', $a['achievement_record_id'], 'TEST_LEADERSHIP', ['position_held' => 'changed']);
        foreach ($expected as &$row) {
            if ($row['record_version_id'] === $a['version']['id'] && $row['field_key'] === 'position_held') {
                $row['field_value'] = '"changed"';
            }
        }
        unset($row);
        self::assertSame($expected, $snapshot());
        $service->save('owner-a', $a['achievement_record_id'], 'TEST_LEADERSHIP', ['position_held' => 'changed']);
        self::assertSame($expected, $snapshot(), 'Repeated updates remain scoped');
        try {
            $service->save('owner-b', $a['achievement_record_id'], 'TEST_LEADERSHIP', ['position_held' => 'attack']);
            self::fail('Cross-owner update accepted');
        } catch (\RuntimeException $e) {
            self::assertSame('STUDENT_ACHIEVEMENT_NOT_FOUND', $e->getMessage());
        }
        self::assertSame($expected, $snapshot());
        $db->close();
    }

    public function testOriginalBuilderPatternLosesWherePredicates(): void
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $db->query('CREATE TABLE draft_probe (version TEXT, field TEXT, value TEXT)');
        $db->query("INSERT INTO draft_probe VALUES ('a','one','old'),('b','two','untouched')");
        $builder = $db->table('draft_probe')->where('version', 'a')->where('field', 'one');
        self::assertSame(1, $builder->countAllResults());
        $sql = $builder->set(['value' => 'overwritten'])->getCompiledUpdate();
        self::assertStringNotContainsString('WHERE', $sql);
        $db->query($sql);
        self::assertSame(2, $db->table('draft_probe')->where('value', 'overwritten')->countAllResults());
        $db->close();
    }
}
