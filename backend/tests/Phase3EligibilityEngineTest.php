<?php

namespace Tests;

use App\Services\AwardEligibilityService;
use CodeIgniter\Test\CIUnitTestCase;

class Phase3EligibilityEngineTest extends CIUnitTestCase
{
    protected AwardEligibilityService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AwardEligibilityService();
    }

    public function testGraduationGatesForGraduatingOnlyAwards(): void
    {
        $gradAward = [
            'id'              => 'test-award-1',
            'code'            => 'NOTRE_DAME_AWARD',
            'status'          => 'active',
            'graduating_only' => 1,
            'gender_restriction' => null,
        ];

        // Graduating student passes
        $gradStudent = [
            'id'           => 'std-grad',
            'status'       => 'active',
            'year_level'   => '4th Year',
            'gender'       => 'Female',
        ];
        $res1 = $this->service->evaluateStudentEligibility($gradAward, $gradStudent);
        $this->assertTrue($res1['eligible']);
        $this->assertTrue($res1['checks']['graduating']['passed']);

        // Non-graduating student fails
        $undergradStudent = [
            'id'           => 'std-ugrad',
            'status'       => 'active',
            'year_level'   => '2nd Year',
            'gender'       => 'Female',
        ];
        $res2 = $this->service->evaluateStudentEligibility($gradAward, $undergradStudent);
        $this->assertFalse($res2['eligible']);
        $this->assertFalse($res2['checks']['graduating']['passed']);
        $this->assertSame('GRADUATING_REQUIREMENT_NOT_MET', $res2['reasons'][0]['code']);
    }

    public function testOpenPoolAwardsAllowNonGraduating(): void
    {
        $openAward = [
            'id'              => 'test-award-2',
            'code'            => 'STUDENT_LEADER_OF_THE_YEAR',
            'status'          => 'active',
            'graduating_only' => 0,
            'gender_restriction' => null,
        ];

        // Non-graduating student passes open pool
        $undergradStudent = [
            'id'           => 'std-ugrad',
            'status'       => 'active',
            'year_level'   => '2nd Year',
            'gender'       => 'Male',
        ];
        $res = $this->service->evaluateStudentEligibility($openAward, $undergradStudent);
        $this->assertTrue($res['eligible']);
        $this->assertTrue($res['checks']['graduating']['passed']);
        $this->assertFalse($res['checks']['graduating']['required']);
    }

    public function testSexGatesForFemaleAndMaleAwards(): void
    {
        $femaleAward = [
            'id'                 => 'test-award-female',
            'code'               => 'SPORTS_AWARD_FEMALE',
            'status'             => 'active',
            'graduating_only'    => 1,
            'gender_restriction' => 'female',
        ];

        // Female student passes
        $femaleStudent = [
            'id'         => 'std-fem',
            'status'     => 'active',
            'year_level' => '4',
            'gender'     => 'female',
        ];
        $res1 = $this->service->evaluateStudentEligibility($femaleAward, $femaleStudent);
        $this->assertTrue($res1['eligible']);
        $this->assertTrue($res1['checks']['sex']['passed']);

        // Male student fails female award
        $maleStudent = [
            'id'         => 'std-male',
            'status'     => 'active',
            'year_level' => '4',
            'gender'     => 'male',
        ];
        $res2 = $this->service->evaluateStudentEligibility($femaleAward, $maleStudent);
        $this->assertFalse($res2['eligible']);
        $this->assertFalse($res2['checks']['sex']['passed']);
        $this->assertSame('SEX_REQUIREMENT_NOT_MET', $res2['reasons'][0]['code']);
    }

    public function testMissingDataFailsSafely(): void
    {
        $gradAward = [
            'id'                 => 'test-award-grad',
            'code'               => 'CAMPUS_JOURNALISM_AWARD',
            'status'             => 'active',
            'graduating_only'    => 1,
            'gender_restriction' => null,
        ];

        // Student with missing year level
        $nullYearStudent = [
            'id'         => 'std-null-yr',
            'status'     => 'active',
            'year_level' => null,
            'gender'     => 'Female',
        ];
        $res1 = $this->service->evaluateStudentEligibility($gradAward, $nullYearStudent);
        $this->assertFalse($res1['eligible']);
        $this->assertSame('GRADUATING_STATUS_MISSING', $res1['reasons'][0]['code']);

        // Female award with missing sex
        $femaleAward = [
            'id'                 => 'test-award-fem',
            'code'               => 'ATHLETE_OF_THE_YEAR_FEMALE',
            'status'             => 'active',
            'graduating_only'    => 0,
            'gender_restriction' => 'female',
        ];
        $nullSexStudent = [
            'id'         => 'std-null-sex',
            'status'     => 'active',
            'year_level' => '3',
            'gender'     => null,
        ];
        $res2 = $this->service->evaluateStudentEligibility($femaleAward, $nullSexStudent);
        $this->assertFalse($res2['eligible']);
        $this->assertSame('SEX_VALUE_MISSING', $res2['reasons'][0]['code']);
    }

    public function testLegacyTotalPointsDoesNotBypassEligibility(): void
    {
        $gradAward = [
            'id'                 => 'test-award-grad',
            'code'               => 'LEADERSHIP_AWARD',
            'status'             => 'active',
            'graduating_only'    => 1,
            'gender_restriction' => null,
        ];

        // Student with huge legacy total_points (9999 pts) but 2nd year
        $highPointsUndergrad = [
            'id'           => 'std-legacy',
            'status'       => 'active',
            'year_level'   => '2nd Year',
            'gender'       => 'Male',
            'total_points' => 9999,
            'min_points'   => 50,
        ];

        $res = $this->service->evaluateStudentEligibility($gradAward, $highPointsUndergrad);
        $this->assertFalse($res['eligible']);
        $this->assertSame('GRADUATING_REQUIREMENT_NOT_MET', $res['reasons'][0]['code']);
    }
}
