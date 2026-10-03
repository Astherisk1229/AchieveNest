<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class AuthoritativeFacultyRankTransitionsTest extends CIUnitTestCase
{
    private function source(string $path): string
    {
        return file_get_contents(ROOTPATH . $path);
    }

    public function testExistingCatalogContainsEveryAuthoritativeFullTimeFacultyTitle(): void
    {
        $catalog = $this->source('app/Database/Migrations/2026-09-08-000064_CreateFacultyRankCatalog.php');
        foreach ([
            'Assistant Instructor', 'Instructor I',
            'Senior Instructor', 'Senior Instructor I', 'Senior Instructor II', 'Senior Instructor III', 'Senior Instructor IV',
            'Assistant Professor', 'Assistant Professor I', 'Assistant Professor II', 'Assistant Professor III', 'Assistant Professor IV',
            'Associate Professor', 'Associate Professor I', 'Associate Professor II', 'Associate Professor III', 'Associate Professor IV',
            'Professor I', 'Professor II', 'Professor III', 'Professor IV',
            'University Professor', 'University Professor I', 'University Professor II', 'University Professor III', 'University Professor IV',
        ] as $title) {
            self::assertStringContainsString("'{$title}'", $catalog);
        }
    }

    public function testInterviewConfirmedBoundaryStepsAreActivated(): void
    {
        $migration = $this->source('app/Database/Migrations/2026-09-15-000005_ReconcileAuthoritativeFacultyRankTransitions.php');
        self::assertStringContainsString("['ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR']", $migration);
        self::assertStringContainsString("['PROFESSOR_IV', 'UNIVERSITY_PROFESSOR']", $migration);
        self::assertStringContainsString("['UNIVERSITY_PROFESSOR', 'UNIVERSITY_PROFESSOR_I']", $migration);
    }

    public function testUnsupportedLegacyEdgesAreRetainedButDeactivated(): void
    {
        $migration = $this->source('app/Database/Migrations/2026-09-15-000005_ReconcileAuthoritativeFacultyRankTransitions.php');
        self::assertStringContainsString("['INSTRUCTOR_I', 'SENIOR_INSTRUCTOR_I']", $migration);
        self::assertStringContainsString("['SENIOR_INSTRUCTOR_IV', 'ASSISTANT_PROFESSOR_I']", $migration);
        self::assertStringContainsString("['ASSOCIATE_PROFESSOR_IV', 'PROFESSOR_I']", $migration);
        self::assertStringContainsString("->update(['is_active' => 0])", $migration);
    }

    public function testOnlyConfirmedHigherJumpRequiresVerifiedPhd(): void
    {
        $migration = $this->source('app/Database/Migrations/2026-09-15-000005_ReconcileAuthoritativeFacultyRankTransitions.php');
        self::assertStringContainsString("->where('from_rank_code', 'ASSISTANT_PROFESSOR_I')", $migration);
        self::assertStringContainsString("->where('to_rank_code', 'PROFESSOR_I')", $migration);
        self::assertStringContainsString("->where('transition_type', 'phd_exception')", $migration);
        self::assertStringContainsString("'requires_verified_phd' => 1", $migration);
    }

    public function testNonTeachingCatalogIsNotInvented(): void
    {
        $migration = $this->source('app/Database/Migrations/2026-09-15-000005_ReconcileAuthoritativeFacultyRankTransitions.php');
        self::assertStringNotContainsString('NON_TEACHING_FACULTY', $migration);

        $service = $this->source('app/Services/FacultyRankProgressionService.php');
        self::assertStringContainsString('Non-Teaching Faculty follows the shared ranking process', $service);
        self::assertStringContainsString("'reason_code' => 'rank_catalog_not_configured'", $service);
        self::assertStringNotContainsString('Non-teaching personnel cannot participate in Faculty rank progression', $service);
    }
}
