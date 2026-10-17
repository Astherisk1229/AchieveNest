<?php

namespace Tests\Isolated;

use App\Services\FacultyRankCatalogService;
use App\Services\FacultyRankProgressionService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use ReflectionClass;
use ReflectionProperty;

final class NonTeachingMastersRankProgressionTest extends CIUnitTestCase
{
    private $sqlite;
    private FacultyRankProgressionService $progression;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE faculty_rank_catalog (id INTEGER PRIMARY KEY, rank_code TEXT, display_label TEXT, catalog_type TEXT, qualification_tier_code TEXT, qualification_source_label TEXT, display_order INTEGER, source_document_id TEXT, source_row_id TEXT, seed_version TEXT, is_active INTEGER)');
        $this->sqlite->query('CREATE TABLE faculty_rank_transitions (id INTEGER PRIMARY KEY, from_rank_code TEXT, to_rank_code TEXT, transition_type TEXT, requires_verified_phd INTEGER, rule_reference TEXT, is_active INTEGER)');
        $this->sqlite->query('CREATE TABLE personnel_credentials (id INTEGER PRIMARY KEY, personnel_profile_id TEXT, credential_type TEXT, degree_level TEXT, verification_status TEXT, record_state TEXT)');
        foreach ([
            ['ASSISTANT_INSTRUCTOR', 'Assistant Instructor', 'baccalaureate'],
            ['SENIOR_INSTRUCTOR', 'Senior Instructor', 'board_licensure'],
            ['ASSISTANT_PROFESSOR', 'Assistant Professor', 'masters'],
            ['ASSISTANT_PROFESSOR_I', 'Assistant Professor I', 'masters'],
            ['PROFESSOR_I', 'Professor I', 'doctoral'],
        ] as $index => [$code, $label, $tier]) {
            $this->sqlite->table('faculty_rank_catalog')->insert([
                'id' => $index + 1, 'rank_code' => $code, 'display_label' => $label,
                'catalog_type' => 'full_time_academic_rank', 'qualification_tier_code' => $tier,
                'qualification_source_label' => '', 'display_order' => $index,
                'source_document_id' => '', 'source_row_id' => '', 'seed_version' => '', 'is_active' => 1,
            ]);
        }
        $catalog = (new ReflectionClass(FacultyRankCatalogService::class))->newInstanceWithoutConstructor();
        (new ReflectionProperty($catalog, 'db'))->setValue($catalog, $this->sqlite);
        $this->progression = (new ReflectionClass(FacultyRankProgressionService::class))->newInstanceWithoutConstructor();
        (new ReflectionProperty($this->progression, 'db'))->setValue($this->progression, $this->sqlite);
        (new ReflectionProperty($this->progression, 'catalogService'))->setValue($this->progression, $catalog);
        $this->sqlite->table('faculty_rank_transitions')->insert([
            'from_rank_code' => 'ASSISTANT_PROFESSOR', 'to_rank_code' => 'PROFESSOR_I',
            'transition_type' => 'phd_exception', 'requires_verified_phd' => 1,
            'rule_reference' => 'verified-phd-rule', 'is_active' => 1,
        ]);
    }

    protected function tearDown(): void
    {
        $this->sqlite->close();
        parent::tearDown();
    }

    public function testBothInstructorEntryRanksRequireVerifiedMastersForAssistantProfessor(): void
    {
        foreach (['ASSISTANT_INSTRUCTOR', 'SENIOR_INSTRUCTOR'] as $rank) {
            $context = ['personnel_profile_id' => 'person-1'];
            $beforeMasters = $this->progression->getAllowedTransitions($rank, $context);
            self::assertSame([], $beforeMasters['all_valid_target_ranks']);
            self::assertSame('QUALIFICATION_REQUIRED', $beforeMasters['status']);
            self::assertFalse($this->progression->isTerminalRank($rank));
            self::assertSame('verified_masters_required',
                $this->progression->validateTransition($rank, 'ASSISTANT_PROFESSOR', $context)['reason_code']);
        }

        $this->sqlite->table('personnel_credentials')->insert([
            'personnel_profile_id' => 'person-1', 'credential_type' => 'degree',
            'degree_level' => 'masters', 'verification_status' => 'pending', 'record_state' => 'active',
        ]);
        self::assertSame([], $this->progression->getAllowedTransitions('ASSISTANT_INSTRUCTOR', ['personnel_profile_id' => 'person-1'])['all_valid_target_ranks']);
        $this->sqlite->table('personnel_credentials')->where('personnel_profile_id', 'person-1')->update(['verification_status' => 'verified']);

        foreach (['ASSISTANT_INSTRUCTOR', 'SENIOR_INSTRUCTOR'] as $rank) {
            $context = ['personnel_profile_id' => 'person-1'];
            $targets = $this->progression->getAllowedTransitions($rank, $context)['all_valid_target_ranks'];
            self::assertSame(['ASSISTANT_PROFESSOR'], array_column($targets, 'rank_code'));
            self::assertSame('masters_qualification',
                $this->progression->validateTransition($rank, 'ASSISTANT_PROFESSOR', $context)['transition_type']);
            self::assertFalse($this->progression->validateTransition($rank, 'ASSISTANT_PROFESSOR_I', $context)['allowed']);
        }
    }

    public function testVerifiedPhdAllowsJumpFromAssistantProfessorToProfessorOne(): void
    {
        $withoutPhd = $this->progression->getAllowedTransitions('ASSISTANT_PROFESSOR');
        self::assertSame([], $withoutPhd['all_valid_target_ranks']);
        self::assertSame('qualification_exception_not_satisfied',
            $this->progression->validateTransition('ASSISTANT_PROFESSOR', 'PROFESSOR_I')['reason_code']);

        $withPhd = ['has_verified_phd' => true];
        self::assertSame(['PROFESSOR_I'], array_column(
            $this->progression->getAllowedTransitions('ASSISTANT_PROFESSOR', $withPhd)['all_valid_target_ranks'], 'rank_code'
        ));
        self::assertTrue($this->progression->validateTransition('ASSISTANT_PROFESSOR', 'PROFESSOR_I', $withPhd)['allowed']);
    }
}
