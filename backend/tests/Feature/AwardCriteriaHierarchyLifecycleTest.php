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

    public function test_draft_hierarchy_clones_saves_reloads_validates_and_publishes_without_changing_scoring_or_history(): void
    {
        $db = $this->sqliteDb;
        $awardId = 'award-1';
        $sourceId = 'scoring-1';
        $db->table('award_definitions')->insert([
            'id' => $awardId, 'name' => 'Test Award', 'status' => 'active', 'active_scoring_version' => '1.0',
            'candidate_threshold_percent' => 80, 'authority_status' => 'OFFICIAL',
        ]);
        $db->table('award_scoring_model_versions')->insert([
            'id' => $sourceId, 'award_definition_id' => $awardId, 'version_number' => '1.0',
            'version_label' => 'Test Award v1.0', 'status' => 'published', 'candidate_threshold_percent' => 80,
            'graduating_only' => 1, 'authority_status' => 'OFFICIAL', 'created_at' => '2026-01-01 00:00:00',
            'updated_at' => '2026-01-01 00:00:00',
        ]);
        $db->table('award_criteria')->insert([
            'id' => 'criterion-1', 'award_definition_id' => $awardId, 'scoring_model_version_id' => $sourceId, 'code' => 'CRIT_TEST', 'name' => 'Existing Category',
            'max_points' => 40, 'sort_order' => 1, 'is_portfolio_computable' => 1,
        ]);
        $db->table('award_criterion_components')->insert([
            'id' => 'component-1', 'criterion_id' => 'criterion-1', 'code' => 'SUB_TEST', 'name' => 'Existing Subcategory',
            'max_points' => 10, 'sort_order' => 1, 'is_computable' => 1,
        ]);
        $service = new AwardCriteriaHierarchyAdministrationService($db);

        $before = $service->get($awardId);
        $source = $before['versions'][0] ?? null;
        $this->assertNotNull($source, 'Test fixture needs a published scoring version.');
        $sourceHierarchy = $source['hierarchy'];
        $activeScoringVersion = '1.0';
        $scoringContractBefore = AwardCandidateDiscoveryService::describeAward($db, $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray());
        $versionNumber = 'T' . substr(bin2hex(random_bytes(5)), 0, 9);

        $draft = $service->createDraft($awardId, [
                'version_number' => $versionNumber,
                'version_label' => 'Hierarchy lifecycle test',
                'effective_date' => date('Y-m-d'),
                'change_reason' => 'Automated hierarchy lifecycle test; rolled back after assertions.',
        ], 'test-actor');
        $this->assertSame('draft', $draft['status']);
        $this->assertEquals($sourceHierarchy['categories'], $draft['hierarchy']['categories'], 'Draft starts with a complete hierarchy clone.');

            $hierarchy = $draft['hierarchy'];
            $hierarchy['categories'][] = [
                'id' => 'test-category-' . bin2hex(random_bytes(4)), 'code' => 'TEST-PD', 'name' => 'Professional Development',
                'cut_off_points' => 40, 'active' => true, 'order' => 999,
                'subcategories' => [[
                    'id' => 'test-subcategory-' . bin2hex(random_bytes(4)), 'name' => 'Seminars and Trainings', 'points' => 10,
                    'active' => true, 'order' => 1,
                    'levels' => [
                        ['id' => 'test-level-r-' . bin2hex(random_bytes(3)), 'name' => 'Regional', 'points' => 6, 'active' => true, 'order' => 1],
                        ['id' => 'test-level-n-' . bin2hex(random_bytes(3)), 'name' => 'National', 'points' => 8, 'active' => true, 'order' => 2],
                        ['id' => 'test-level-i-' . bin2hex(random_bytes(3)), 'name' => 'International', 'points' => 10, 'active' => true, 'order' => 3],
                    ],
                ]],
            ];
        $service->saveDraft($awardId, $draft['id'], $hierarchy);
        $reloaded = $service->get($awardId);
            $savedDraft = array_values(array_filter($reloaded['versions'], static fn(array $v): bool => $v['id'] === $draft['id']))[0];
            $this->assertSame($hierarchy, $savedDraft['hierarchy'], 'Draft hierarchy persists and reloads from JSON configuration.');
            $this->assertTrue($service->validate($awardId, $draft['id'])['valid']);

        $published = $service->publish($awardId, $draft['id'], 'test-actor');
        $this->assertSame('published', $published['status']);
        $currentAward = $db->table('award_definitions')->where('id', $awardId)->get()->getRowArray();
        $this->assertSame($activeScoringVersion, (string) $currentAward['active_scoring_version'], 'Hierarchy publishing must not switch the scoring model.');
        $this->assertSame($draft['id'], $currentAward['active_hierarchy_version_id']);

        $activeContract = AwardCandidateDiscoveryService::describeAward($db, $currentAward);
        $publishedCategoryNames = array_column($activeContract['criteria_hierarchy']['categories'], 'name');
        $this->assertContains('Professional Development', $publishedCategoryNames, 'Award API returns the newly published hierarchy for new choices.');
        $this->assertSame($scoringContractBefore['scoring_version_id'], $activeContract['scoring_version_id'], 'Hierarchy publishing must preserve the active executable scoring version ID.');

        $oldVersion = $db->table('award_scoring_model_versions')->where('id', $sourceId)->get()->getRowArray();
        $this->assertSame('published', $oldVersion['status']);
        $oldHierarchyAfter = $service->get($awardId)['versions'];
        $oldHierarchyAfter = array_values(array_filter($oldHierarchyAfter, static fn(array $v): bool => $v['id'] === $sourceId))[0]['hierarchy'];
        $this->assertSame($sourceHierarchy, $oldHierarchyAfter, 'Published source and its historical hierarchy remain unchanged.');
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
