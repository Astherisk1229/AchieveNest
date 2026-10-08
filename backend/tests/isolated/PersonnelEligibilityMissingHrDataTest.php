<?php
namespace Tests\Isolated;

use App\Services\PersonnelEligibilityService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/**
 * Portfolio eligibility names the exact missing HR master-data field instead of a generic message,
 * and becomes eligible on its own once HR records it. Eligibility rules are unchanged. SQLite :memory:.
 */
final class PersonnelEligibilityMissingHrDataTest extends CIUnitTestCase
{
    private $sqlite;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, designation_title TEXT, status TEXT)',
            'CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY, personnel_group TEXT, personnel_classification TEXT, organizational_side TEXT, faculty_engagement TEXT, employment_status TEXT, employment_start_date TEXT, position_title TEXT, current_rank_title TEXT)',
            'CREATE TABLE personnel_college_affiliations (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE personnel_administrative_unit_affiliations (personnel_profile_id TEXT, administrative_unit_id TEXT, is_active INTEGER)',
            'CREATE TABLE administrative_units (id TEXT, college_id TEXT, status TEXT)',
            'CREATE TABLE dean_assignments (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE personnel_evaluation_periods (id TEXT PRIMARY KEY, academic_year TEXT, period_code TEXT, status TEXT, evaluation_end_at TEXT, personnel_group TEXT)',
            'CREATE TABLE personnel_annual_review_imports (id TEXT, personnel_profile_id TEXT, evaluation_period_id TEXT, two_review_status TEXT, two_review_reason TEXT, review_1_school_year TEXT, review_1_rating TEXT, review_2_school_year TEXT, review_2_rating TEXT, confirmed_at TEXT, superseded_at TEXT)',
            'CREATE TABLE personnel_accomplishments (id TEXT PRIMARY KEY, personnel_profile_id TEXT, category_code TEXT, status TEXT, date_achieved TEXT)',
            'CREATE TABLE personnel_accomplishment_evidence (id TEXT PRIMARY KEY, accomplishment_id TEXT, security_status TEXT)',
        ] as $sql) $this->sqlite->query($sql);
        $this->sqlite->table('profiles')->insert(['id' => 'P1', 'full_name' => 'Fixture Faculty', 'status' => 'active']);
        $this->sqlite->table('personnel_profiles')->insert(['profile_id' => 'P1', 'personnel_group' => 'faculty', 'employment_status' => 'permanent', 'employment_start_date' => null]);
        $this->sqlite->table('personnel_evaluation_periods')->insert(['id' => 'TRACK', 'academic_year' => '2027-2028', 'status' => 'OPEN_FOR_SUBMISSION', 'evaluation_end_at' => '2026-10-17 23:59:59', 'personnel_group' => 'FACULTY']);
        $this->sqlite->table('personnel_accomplishments')->insert(['id' => 'ACC1', 'personnel_profile_id' => 'P1', 'category_code' => 'B.2', 'status' => 'draft', 'date_achieved' => '2026-03-15']);
        $this->sqlite->table('personnel_accomplishment_evidence')->insert(['id' => 'EV1', 'accomplishment_id' => 'ACC1', 'security_status' => 'clean']);
        // Confirmed, passing two-year annual review (as in the real import).
        $this->sqlite->table('personnel_annual_review_imports')->insert(['id' => 'IMP', 'personnel_profile_id' => 'P1', 'evaluation_period_id' => 'TRACK', 'two_review_status' => 'passed', 'review_1_school_year' => '2025-2026', 'review_1_rating' => 'satisfactory', 'review_2_school_year' => '2026-2027', 'review_2_rating' => 'satisfactory', 'confirmed_at' => '2026-10-01 14:00:00']);
    }

    protected function tearDown(): void
    {
        $this->sqlite->close();
        parent::tearDown();
    }

    private function evaluate(): array
    {
        return (new PersonnelEligibilityService($this->sqlite))->evaluateEligibility('P1', 'TRACK');
    }

    private function setPerson(array $values): void
    {
        $this->sqlite->table('personnel_profiles')->where('profile_id', 'P1')->update($values);
    }

    public function testMissingStartDateIsNamedAndEligibilityStaysPending(): void
    {
        $result = $this->evaluate();
        self::assertSame('passed', $result['annual_review_requirement']['status']);
        self::assertSame('pending', $result['eligibility_status']);
        self::assertSame(['employment_start_date'], array_column($result['missing_hr_requirements'], 'field'));
        self::assertSame('Employment start date', $result['missing_hr_requirements'][0]['label']);
    }

    public function testStartDateAfterServiceCutoffIsReportedPrecisely(): void
    {
        $this->setPerson(['employment_start_date' => '2027-01-15']);
        $result = $this->evaluate();
        self::assertSame('pending', $result['eligibility_status']);
        self::assertStringContainsString('later than the service cutoff (2026-10-17)', $result['missing_hr_requirements'][0]['detail']);
    }

    public function testRecordingTheStartDateMakesPermanentFacultyEligibleAutomatically(): void
    {
        $this->setPerson(['employment_start_date' => '2019-06-03']);
        $result = $this->evaluate();
        self::assertSame('eligible', $result['eligibility_status']);
        self::assertSame([], $result['missing_hr_requirements']);
    }

    public function testExistingProbationaryServiceRuleIsUnchanged(): void
    {
        $this->setPerson(['employment_status' => 'probationary', 'employment_start_date' => '2025-06-01']);
        $result = $this->evaluate();
        self::assertSame('not_eligible', $result['eligibility_status']);
        self::assertContains('Probationary personnel require at least 3.00 years of service.', $result['eligibility_reasons']);
        self::assertSame([], $result['missing_hr_requirements']);
    }

    public function testTeachingRequiresResearchOutputAndCleanEvidence(): void
    {
        $this->setPerson(['employment_start_date' => '2019-06-03']);
        $this->sqlite->table('personnel_accomplishment_evidence')->where('id', 'EV1')->delete();
        $result = $this->evaluate();
        self::assertSame('pending', $result['eligibility_status']);
        self::assertSame('pending', $result['research_output_requirement']['status']);
        self::assertContains('At least one Research Output in the Publications category with clean supporting evidence is required before evaluation.', $result['eligibility_reasons']);
    }

    public function testTeachingResearchOutputRequiresCanonicalResearchCategory(): void
    {
        $this->setPerson(['employment_start_date' => '2019-06-03']);
        $this->sqlite->table('personnel_accomplishments')->where('id', 'ACC1')->update(['category_code' => 'B3_RESEARCH']);
        $result = $this->evaluate();
        self::assertSame('pending', $result['eligibility_status']);
        self::assertSame('pending', $result['research_output_requirement']['status']);
    }

    public function testMissingPersonnelTypeRequiresHrClassification(): void
    {
        $this->setPerson(['personnel_group' => null, 'organizational_side' => 'academic', 'employment_start_date' => '2019-06-03']);
        $result = $this->evaluate();
        self::assertSame('pending', $result['eligibility_status']);
        self::assertSame('pending', $result['personnel_type_requirement']['status']);
    }

    public function testNonTeachingDoesNotReceiveTeachingResearchGate(): void
    {
        $this->setPerson(['personnel_group' => 'non_teaching_faculty', 'employment_start_date' => '2019-06-03']);
        $this->sqlite->table('personnel_accomplishment_evidence')->where('id', 'EV1')->delete();
        $result = $this->evaluate();
        self::assertSame('eligible', $result['eligibility_status']);
        self::assertSame('not_applicable', $result['research_output_requirement']['status']);
    }
}
