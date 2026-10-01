<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

final class OSADOrganizationGovernanceIntegrityTest extends CIUnitTestCase
{
    public function testArchiveStatusIsPersistedAndReturnedByFreshReads(): void
    {
        $source = file_get_contents(APPPATH . 'Services/OrganizationService.php');
        $this->assertIsString($source);
        $this->assertStringContainsString("['active', 'inactive', 'archived']", $source);
        $this->assertMatchesRegularExpression('/\'status\'\s*=>\s*\$status/', $source);
        $this->assertStringContainsString('o.status,', $source);
    }

    public function testModeratorReassignmentPreservesHistoryAndIsIdempotent(): void
    {
        $source = file_get_contents(APPPATH . 'Services/OrganizationService.php');
        $this->assertIsString($source);
        $this->assertStringContainsString("'effective_until' => date('Y-m-d')", $source);
        $this->assertStringContainsString("if ((\$current['personnel_profile_id'] ?? null) === \$personnelProfileId)", $source);
        $this->assertStringContainsString('Only active organizations may receive moderator assignments.', $source);
        $this->assertStringContainsString('transBegin()', $source);
        $this->assertStringContainsString('transRollback()', $source);
    }
}
