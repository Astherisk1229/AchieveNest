<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class OSADAcademicPlacementIntegrityTest extends CIUnitTestCase
{
    public function testManualStudentValidatesProgramOwnershipUsingBothCanonicalIds(): void
    {
        $source = file_get_contents(APPPATH . 'Controllers/Api/TargetProvisioningController.php');

        $this->assertIsString($source);
        $this->assertMatchesRegularExpression(
            '/where\(\'id\', \$academicProgramId\)[\s\S]*where\(\'college_id\', \$collegeId\)/',
            $source
        );
        $this->assertStringContainsString('ACADEMIC_PROGRAM_NOT_FOUND', $source);
    }

    public function testStudentProvisioningUsesOneDatabaseTransaction(): void
    {
        $source = file_get_contents(APPPATH . 'Controllers/Api/TargetProvisioningController.php');

        $this->assertIsString($source);
        $this->assertStringContainsString('transStart()', $source);
        $this->assertStringContainsString('transComplete()', $source);
        $this->assertStringContainsString('transStatus()', $source);
    }
}
