<?php

namespace Tests\Feature;

use App\Services\AwardCandidateDiscoveryService;
use App\Services\AwardCriteriaHierarchyAdministrationService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/** Persistence proof against a disposable SQLite database created for this test. */
final class AwardCriteriaHierarchyLifecycleTest extends CIUnitTestCase
{
    private $sqliteDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqliteDb = Database::connect([
            'DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => '', 'DBDebug' => true,
            'foreignKeys' => true,
        ], false);
        $this->createSchema();
    }

    public function test_osad_loads_and_saves_the_current_hierarchy_in_place_without_changing_scoring_rules(): void
    {
        $db = $this->sqliteDb;
        $awardId = 'award-1';
        $versionId = 'scoring-1';
        $db->table('award_definitions')->insert([
            'id' => $awardId, 'name' => 'Test Award', 'status' => 'active', 'active_scoring_version' => '1.0',
            'active_hierarchy_version_id' => $versionId, 'candidate_threshold_percent' => 80, 'authority_status' => 'OFFICIAL',
        ]);
        $db->table('award_scoring_model_versions')->insert([
            'id' => $versionId, 'award_definition_id' => $awardId, 'version_number' => '1.0',
            'version_label' => 'Test Award v1.0', 'status' => 'published', 'candidate_threshold_percent' => 80,
            'graduating_only' => 1, 'authority_status' => 'OFFICIAL', 'created_at' => '2026-01-01 00:00:00',
            'updated_at' => '2026-01-01 00:00:00',
        ]);
        $db->table('award_criteria')->insert([
            'id' => 'criterion-1', 'award_definition_id' => $awardId, 'scoring_model_version_id' => $versionId,
            'code' => 'CRIT_TEST', 'name' => 'Existing Category', 'max_points' => 40, 'sort_order' => 1,
            'is_portfolio_computable' => 1,
        ]);
        $db->table('award_criterion_components')->insert([
            'id' => 'component-1', 'criterion_id' => 'criterion-1', 'code' => 'SUB_TEST',
            'name' => 'Existing Subcategory', 'max_points' => 10, 'sort_order' => 1, 'is_computable' => 1,
        ]);
        $service = new AwardCriteriaHierarchyAdministrationService($db);

        $before = $service->get($awardId);
        $this->assertSame('award-1', $before['award']['id']);
        $hierarchy = $before['hierarchy'];
        $this->assertSame('Existing Category', $hierarchy['categories'][0]['name']);
        $scoringBefore = AwardCandidateDiscoveryService::describeAward($db, $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray());

        $hierarchy['categories'][0]['name'] = 'Updated Category';
        $saved = $service->saveCurrent($awardId, $hierarchy);

        // JSON encoding may normalize an integral decimal (40.0) to an integer (40).
        // The persisted point values are numeric; their JSON number representation is not a scoring change.
        $this->assertEquals($hierarchy, $saved['hierarchy']);
        $this->assertSame(1, $db->table('award_scoring_model_versions')->where('award_definition_id', $awardId)->countAllResults(), 'Saving in place must not create a criteria version.');
        $this->assertSame('published', $db->table('award_scoring_model_versions')->where('id', $versionId)->get()->getRowArray()['status']);
        $this->assertSame('Existing Category', $db->table('award_criteria')->where('id', 'criterion-1')->get()->getRowArray()['name'], 'Executable scoring criteria remain unchanged.');

        $currentAward = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        $scoringAfter = AwardCandidateDiscoveryService::describeAward($db, $currentAward);
        $this->assertSame($scoringBefore['scoring_version_id'], $scoringAfter['scoring_version_id']);
        $this->assertSame('Updated Category', $scoringAfter['criteria_hierarchy']['categories'][0]['name']);
    }

    private function createSchema(): void
    {
        $this->sqliteDb->query('CREATE TABLE award_definitions (id TEXT PRIMARY KEY, name TEXT, status TEXT, active_scoring_version TEXT, active_hierarchy_version_id TEXT, candidate_threshold_percent REAL, authority_status TEXT)');
        $this->sqliteDb->query('CREATE TABLE award_scoring_model_versions (id TEXT PRIMARY KEY, award_definition_id TEXT, award_cycle_id TEXT, version_number TEXT, version_label TEXT, status TEXT, candidate_threshold_percent REAL, graduating_only INTEGER, gender_requirement TEXT, authority_status TEXT, hierarchy_config TEXT, change_reason TEXT, effective_date TEXT, published_at TEXT, published_by TEXT, created_at TEXT, updated_at TEXT)');
        $this->sqliteDb->query('CREATE TABLE award_criteria (id TEXT PRIMARY KEY, award_definition_id TEXT, scoring_model_version_id TEXT, code TEXT, name TEXT, max_points REAL, sort_order INTEGER, is_portfolio_computable INTEGER)');
        $this->sqliteDb->query('CREATE TABLE award_scoring_rules (criterion_id TEXT, is_active INTEGER, sort_order INTEGER, criterion_component_id TEXT)');
        $this->sqliteDb->query('CREATE TABLE award_criterion_components (id TEXT PRIMARY KEY, criterion_id TEXT, code TEXT, name TEXT, max_points REAL, sort_order INTEGER, is_computable INTEGER)');
    }
}
